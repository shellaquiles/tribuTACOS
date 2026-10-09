"""
Tests de integración para los endpoints de la API FastAPI de tributacos.
"""

from datetime import datetime
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Credenciales de un contribuyente de prueba. Con la autenticación activada
# (valor por defecto), las rutas de datos exigen un token Bearer válido.
_TEST_CLIENT_ID = "testco"
_TEST_RFC = "TES010101TES"
_TEST_PASSWORD = "test-password-123"


def _auth_headers():
    """Registra (idempotente) e inicia sesión con el contribuyente de prueba."""
    client.post("/api/clients", json={
        "id": _TEST_CLIENT_ID,
        "name": "Test Co",
        "rfc": _TEST_RFC,
        "password": _TEST_PASSWORD,
    })  # 201 la primera vez, 400 si ya existe
    res = client.post("/auth/login", json={"rfc": _TEST_RFC, "password": _TEST_PASSWORD})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_requires_auth_on_data_routes():
    """Sin token, las rutas de datos deben rechazar el acceso (401)."""
    assert client.get("/api/summary").status_code == 401
    assert client.get("/api/clients").status_code == 401
    assert client.get("/api/sat_docs/summary?year=2024").status_code == 401


def test_login_requires_valid_password():
    """El login no debe emitir token sin verificar la contraseña."""
    _auth_headers()  # asegura que el contribuyente exista
    assert client.post("/auth/login", json={"rfc": _TEST_RFC, "password": "wrong"}).status_code == 401
    assert client.post("/auth/login", json={"rfc": _TEST_RFC}).status_code == 401


def test_cross_tenant_access_forbidden():
    """Un contribuyente no puede acceder a datos de otro (BOLA)."""
    headers = _auth_headers()
    res = client.get("/api/clients/someone-else/exclusions", headers=headers)
    assert res.status_code == 403


def test_root_endpoint():
    """Valida la respuesta del endpoint raíz."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "tributacos" in data.get("app", "")
    assert data.get("status") == "ready"


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json().get("status") == "ready"


def test_list_clients():
    """Valida el endpoint de listado de clientes (solo el autenticado)."""
    headers = _auth_headers()
    response = client.get("/api/clients", headers=headers)
    assert response.status_code == 200
    clients = response.json()
    assert isinstance(clients, list)
    assert len(clients) == 1
    assert clients[0]["id"] == _TEST_CLIENT_ID
    assert "rfc" in clients[0]


def test_get_taxonomia():
    """Valida el endpoint de taxonomía SAT."""
    response = client.get("/api/catalogos/sat-gastos")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "success"
    assert "taxonomia" in data


def test_get_summary():
    """Valida el endpoint de resumen fiscal por defecto (año actual) y con query param."""
    headers = _auth_headers()
    # 1. Por defecto: año actual
    response = client.get("/api/summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data.get("year") == str(datetime.now().year)
    assert "sections" in data
    assert "summary" in data

    # 2. Con año explícito (2024)
    res_2024 = client.get("/api/summary?year=2024", headers=headers)
    assert res_2024.status_code == 200
    d_2024 = res_2024.json()
    assert d_2024.get("year") == "2024"
    assert "sueldos" in d_2024["sections"]
    assert "honorarios" in d_2024["sections"]
    assert "reporte_gastos" in d_2024["sections"]
    assert "deducciones_personales" in d_2024["sections"]
    assert "simulacion_anual" in d_2024


def test_client_exclusions_and_constancias():
    """Valida los endpoints de exclusiones y constancias fiscales por cliente."""
    headers = _auth_headers()
    # 1. Exclusiones (del propio contribuyente autenticado)
    res_excl = client.get(f"/api/clients/{_TEST_CLIENT_ID}/exclusions", headers=headers)
    assert res_excl.status_code == 200
    assert isinstance(res_excl.json(), list)

    # 2. Constancias
    res_const = client.get(f"/api/clients/{_TEST_CLIENT_ID}/constancias", headers=headers)
    assert res_const.status_code == 200
    assert isinstance(res_const.json(), list)

    # 3. Tarifas SAT Art. 152 (catálogo público, no requiere token)
    res_tarifas = client.get("/api/sat/tarifas/2024")
    assert res_tarifas.status_code == 200
    tarifas = res_tarifas.json()
    assert len(tarifas) == 11
    assert tarifas[0]["limite_inferior"] == 0.01
