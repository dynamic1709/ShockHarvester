"""
Test suite for client-self endpoints (/api/me/*).
"""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest_asyncio.fixture(scope="module")
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_client_portfolio_screens(client: AsyncClient):
    # 1. Login as investor1 (Aggressive)
    inv1_login = await client.post(
        "/api/auth/login",
        json={"email": "investor1@shockharvester.com", "password": "password123"},
    )
    assert inv1_login.status_code == 200
    token1 = inv1_login.json()["access_token"]
    h1 = {"Authorization": f"Bearer {token1}"}

    # 2. Login as investor2 (Conservative)
    inv2_login = await client.post(
        "/api/auth/login",
        json={"email": "investor2@shockharvester.com", "password": "password123"},
    )
    assert inv2_login.status_code == 200
    token2 = inv2_login.json()["access_token"]
    h2 = {"Authorization": f"Bearer {token2}"}

    # Test /api/me/portfolio for investor 1
    p1_res = await client.get("/api/me/portfolio", headers=h1)
    assert p1_res.status_code == 200
    p1 = p1_res.json()
    assert p1["total_portfolio_value"] > 0
    assert p1["invested_amount"] > 0
    assert len(p1["allocation"]) >= 2

    # Test /api/me/portfolio for investor 2 (should differ in model and metrics)
    p2_res = await client.get("/api/me/portfolio", headers=h2)
    assert p2_res.status_code == 200
    p2 = p2_res.json()
    assert p1["client_id"] != p2["client_id"]
    assert p1["model_name"] != p2["model_name"]

    # Test /api/me/holdings
    holdings_res = await client.get("/api/me/holdings", headers=h1)
    assert holdings_res.status_code == 200
    holdings = holdings_res.json()
    assert len(holdings) > 0
    assert "symbol" in holdings[0]
    assert "current_value" in holdings[0]

    # Test /api/me/lots
    lots_res = await client.get("/api/me/lots", headers=h1)
    assert lots_res.status_code == 200
    lots = lots_res.json()
    assert len(lots) > 0
    assert "buy_date" in lots[0]
    assert "tax_type" in lots[0]

    # Test /api/me/tax-summary
    tax_res = await client.get("/api/me/tax-summary", headers=h1)
    assert tax_res.status_code == 200
    tax = tax_res.json()
    assert tax["fy"] == "2024-2025"
    assert "exemption_utilized" in tax
    assert "estimated_tax_liability" in tax

    # Test /api/me/watchlist (get, add, remove)
    wl_res = await client.get("/api/me/watchlist", headers=h1)
    assert wl_res.status_code == 200
    wl = wl_res.json()
    assert len(wl) > 0

    add_res = await client.post("/api/me/watchlist", headers=h1, json={"symbol": "MARUTI"})
    assert add_res.status_code in (200, 201)

    del_res = await client.delete("/api/me/watchlist/MARUTI", headers=h1)
    assert del_res.status_code == 200
