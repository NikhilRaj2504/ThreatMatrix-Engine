import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_and_root():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "HEALTHY"

        root_res = await client.get("/")
        assert root_res.status_code == 200
        assert root_res.json()["status"] == "ONLINE"


@pytest.mark.asyncio
async def test_simulation_scenarios_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/simulation/scenarios")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 5
        assert data[0]["id"] == "scenario_1_safe"
        assert data[4]["id"] == "scenario_5_combined_scam"
