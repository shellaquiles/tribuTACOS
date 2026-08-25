"""
Tests de integración para los endpoints de la API FastAPI de tributacos.
"""

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


def test_get_summary_2024():
    """Valida el endpoint de resumen fiscal para un ejercicio."""
    response = client.get("/api/summary?year=2024")
    assert response.status_code == 200
    data = response.json()
    assert data.get("year") == "2024"
    assert "sections" in data
    assert "sueldos" in data["sections"]
    assert "honorarios" in data["sections"]
    assert "reporte_gastos" in data["sections"]
    assert "deducciones_personales" in data["sections"]
    assert "summary" in data
    assert "simulacion_anual" in data
