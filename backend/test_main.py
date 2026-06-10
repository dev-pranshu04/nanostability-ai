from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200

def test_predict_valid_input():
    payload = {
        "homo_lumo_gap": 1.2,
        "formation_energy": -2.5,
        "binding_energy": -1.8,
        # ... fill remaining 8 features with valid ranges
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    assert "stability" in response.json()
