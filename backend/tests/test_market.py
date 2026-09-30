"""
Market endpoints test suite.
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
async def test_market_endpoints(client: AsyncClient):
    # Login as investor1
    login_res = await client.post(
        "/api/auth/login",
        json={"email": "investor1@shockharvester.com", "password": "password123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Test indices
    idx_res = await client.get("/api/market/indices", headers=headers)
    assert idx_res.status_code == 200
    indices = idx_res.json()
    assert len(indices) >= 2
    symbols = [idx["symbol"] for idx in indices]
    assert "^NSEI" in symbols
    assert "^NSEBANK" in symbols

    # 2. Test securities list
    sec_res = await client.get("/api/market/securities", headers=headers)
    assert sec_res.status_code == 200
    securities = sec_res.json()
    assert len(securities) >= 20
    rel = next((s for s in securities if s["symbol"] == "RELIANCE"), None)
    assert rel is not None
    assert rel["ltp"] > 0
    assert rel["lower_circuit"] < rel["ltp"] < rel["upper_circuit"]

    # 3. Test security detail
    detail_res = await client.get("/api/market/securities/TCS", headers=headers)
    assert detail_res.status_code == 200
    tcs = detail_res.json()
    assert tcs["symbol"] == "TCS"
    assert tcs["sector"] == "IT"
    assert len(tcs["substitutes"]) > 0

    # 4. Test history endpoint
    hist_res = await client.get("/api/market/securities/INFY/history?range=1M", headers=headers)
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert hist["symbol"] == "INFY"
    assert hist["count"] > 0
    assert "candles" in hist
    assert "open" in hist["candles"][0]
    assert "close" in hist["candles"][0]
