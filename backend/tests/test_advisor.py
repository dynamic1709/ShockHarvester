import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_advisor_auth_and_summary():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as advisor
        login_res = await ac.post("/api/auth/login", json={
            "email": "advisor@shockharvester.com",
            "password": "password123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Summary
        sum_res = await ac.get("/api/advisor/summary", headers=headers)
        assert sum_res.status_code == 200
        data = sum_res.json()
        assert "total_clients" in data
        assert "total_aum_inr" in data
        assert data["total_clients"] >= 5

        # 3. Clients list
        clients_res = await ac.get("/api/advisor/clients?page=1&limit=10", headers=headers)
        assert clients_res.status_code == 200
        c_data = clients_res.json()
        assert "items" in c_data
        assert len(c_data["items"]) > 0

        # 4. Tax rules
        tax_res = await ac.get("/api/advisor/tax-rules", headers=headers)
        assert tax_res.status_code == 200
        t_data = tax_res.json()
        assert t_data["stcg_rate"] == 0.20
        assert t_data["ltcg_rate"] == 0.125
        assert t_data["ltcg_annual_exemption_inr"] == 125000.0

        # 5. Backtest Scenarios
        scen_res = await ac.get("/api/advisor/backtest/scenarios", headers=headers)
        assert scen_res.status_code == 200
        assert len(scen_res.json()) >= 2

        # 6. Run Backtest
        bt_res = await ac.post("/api/advisor/backtest/run", headers=headers, json={
            "scenario": "covid_2020",
            "initial_capital": 10000000.0,
            "equity_weight": 0.70
        })
        assert bt_res.status_code == 200
        bt_data = bt_res.json()
        assert "shock_harvester" in bt_data
        assert "quarterly_rebalance" in bt_data
        assert "buy_and_hold" in bt_data
        assert len(bt_data["time_series"]) > 0
