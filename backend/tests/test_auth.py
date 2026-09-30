"""
Auth tests:
- Login success & failure
- /api/auth/me endpoint & 401 on missing/bad token
- require_advisor (403 for client)
- require_client_self (403 when client accesses another client_id)
- Logout endpoint
"""
import pytest
import pytest_asyncio
import uuid
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from fastapi import APIRouter, Depends

from app.main import app
from app.database import Base, get_db
from app.auth.deps import require_advisor, require_client_self
from app.seed_demo import ensure_demo_users
from app.models.portfolio import Client
from app.models.user import User

# Test router to explicitly verify require_advisor and require_client_self guards
guard_router = APIRouter(prefix="/api/test-guards", tags=["test"])

@guard_router.get("/advisor-only")
async def dummy_advisor_route(user: User = Depends(require_advisor)):
    return {"status": "ok", "user": user.email}

@guard_router.get("/client/{client_id}")
async def dummy_client_self_route(
    client_id: uuid.UUID,
    user: User = Depends(require_client_self("client_id")),
):
    return {"status": "ok", "client_id": str(client_id), "user": user.email}

app.include_router(guard_router)


@pytest_asyncio.fixture(scope="module")
async def test_client():
    test_db_url = "sqlite+aiosqlite:///:memory:"
    engine = create_async_engine(test_db_url, echo=False)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        await ensure_demo_users(session)

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.mark.asyncio
async def test_login_success_advisor(test_client: AsyncClient):
    response = await test_client.post(
        "/api/auth/login",
        json={"email": "advisor@shockharvester.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "advisor"
    assert data["email"] == "advisor@shockharvester.com"


@pytest.mark.asyncio
async def test_login_success_client(test_client: AsyncClient):
    response = await test_client.post(
        "/api/auth/login",
        json={"email": "investor1@shockharvester.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "client"
    assert data["client_id"] is not None


@pytest.mark.asyncio
async def test_login_invalid_credentials(test_client: AsyncClient):
    response = await test_client.post(
        "/api/auth/login",
        json={"email": "advisor@shockharvester.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_login_nonexistent_user(test_client: AsyncClient):
    response = await test_client.post(
        "/api/auth/login",
        json={"email": "nonexistent@shockharvester.com", "password": "password123"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_endpoint(test_client: AsyncClient):
    # First login
    login_res = await test_client.post(
        "/api/auth/login",
        json={"email": "investor1@shockharvester.com", "password": "password123"},
    )
    token = login_res.json()["access_token"]

    # Call /me with header
    res = await test_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    me_data = res.json()
    assert me_data["email"] == "investor1@shockharvester.com"
    assert me_data["role"] == "client"
    assert me_data["client_id"] is not None


@pytest.mark.asyncio
async def test_me_unauthorized(test_client: AsyncClient):
    res = await test_client.get("/api/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_advisor_role_guard(test_client: AsyncClient):
    # Investor login
    login_res = await test_client.post(
        "/api/auth/login",
        json={"email": "investor1@shockharvester.com", "password": "password123"},
    )
    client_token = login_res.json()["access_token"]

    # Attempt to access advisor-only route
    res = await test_client.get(
        "/api/test-guards/advisor-only",
        headers={"Authorization": f"Bearer {client_token}"},
    )
    assert res.status_code == 403
    assert "Advisor access required" in res.json()["detail"]

    # Advisor login can access it
    advisor_login = await test_client.post(
        "/api/auth/login",
        json={"email": "advisor@shockharvester.com", "password": "password123"},
    )
    adv_token = advisor_login.json()["access_token"]
    adv_res = await test_client.get(
        "/api/test-guards/advisor-only",
        headers={"Authorization": f"Bearer {adv_token}"},
    )
    assert adv_res.status_code == 200


@pytest.mark.asyncio
async def test_client_self_guard(test_client: AsyncClient):
    # Investor 1 login
    inv1_res = await test_client.post(
        "/api/auth/login",
        json={"email": "investor1@shockharvester.com", "password": "password123"},
    )
    inv1_data = inv1_res.json()
    inv1_token = inv1_data["access_token"]
    inv1_client_id = inv1_data["client_id"]

    # Investor 2 login
    inv2_res = await test_client.post(
        "/api/auth/login",
        json={"email": "investor2@shockharvester.com", "password": "password123"},
    )
    inv2_data = inv2_res.json()
    inv2_client_id = inv2_data["client_id"]

    # Investor 1 accesses own client data -> 200
    res_own = await test_client.get(
        f"/api/test-guards/client/{inv1_client_id}",
        headers={"Authorization": f"Bearer {inv1_token}"},
    )
    assert res_own.status_code == 200

    # Investor 1 accesses Investor 2 client data -> 403
    res_other = await test_client.get(
        f"/api/test-guards/client/{inv2_client_id}",
        headers={"Authorization": f"Bearer {inv1_token}"},
    )
    assert res_other.status_code == 403
    assert "Access forbidden" in res_other.json()["detail"]

    # Advisor accesses any client data -> 200
    advisor_login = await test_client.post(
        "/api/auth/login",
        json={"email": "advisor@shockharvester.com", "password": "password123"},
    )
    adv_token = advisor_login.json()["access_token"]
    res_adv = await test_client.get(
        f"/api/test-guards/client/{inv2_client_id}",
        headers={"Authorization": f"Bearer {adv_token}"},
    )
    assert res_adv.status_code == 200


@pytest.mark.asyncio
async def test_logout_endpoint(test_client: AsyncClient):
    login_res = await test_client.post(
        "/api/auth/login",
        json={"email": "advisor@shockharvester.com", "password": "password123"},
    )
    token = login_res.json()["access_token"]

    res = await test_client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["message"] == "Logged out successfully"
