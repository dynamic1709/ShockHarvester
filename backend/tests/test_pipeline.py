import pytest
from app.database import AsyncSessionLocal
from app.engine.pipeline import execute_rebalance_pipeline

@pytest.mark.asyncio
async def test_pipeline_execution():
    async with AsyncSessionLocal() as session:
        result = execute_rebalance_pipeline
        res = await execute_rebalance_pipeline(session, scenario_name="election_2024")
        assert res is not None
        assert res.total_clients_checked > 0
        assert res.total_execution_time_sec < 10.0
        assert res.status == "completed"
        print(f"Pipeline executed in {res.total_execution_time_sec:.3f}s for {res.total_clients_checked} clients")
