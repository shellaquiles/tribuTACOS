"""
Tests de integración para los endpoints de la API FastAPI de tributacos.
"""

from datetime import datetime
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


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
    """Valida el endpoint de listado de clientes."""
    response = client.get("/api/clients")
    assert response.status_code == 200
    clients = response.json()
    assert isinstance(clients, list)
    assert len(clients) >= 1
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
    # 1. Por defecto: año actual
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert data.get("year") == str(datetime.now().year)
    assert "sections" in data
    assert "summary" in data

    # 2. Con año explícito (2024)
    res_2024 = client.get("/api/summary?year=2024")
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
    # 1. Exclusiones
    res_excl = client.get("/api/clients/default/exclusions")
    assert res_excl.status_code == 200
    assert isinstance(res_excl.json(), list)

    # 2. Constancias
    res_const = client.get("/api/clients/default/constancias")
    assert res_const.status_code == 200
    assert isinstance(res_const.json(), list)

    # 3. Tarifas SAT Art. 152
    res_tarifas = client.get("/api/sat/tarifas/2024")
    assert res_tarifas.status_code == 200
    tarifas = res_tarifas.json()
    assert len(tarifas) == 11
    assert tarifas[0]["limite_inferior"] == 0.01
