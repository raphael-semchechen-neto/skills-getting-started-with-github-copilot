import copy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from src.app import activities as activities_store
from src.app import app


@pytest.fixture
def client():
    original_activities = copy.deepcopy(activities_store)

    with TestClient(app) as test_client:
        yield test_client

    activities_store.clear()
    activities_store.update(copy.deepcopy(original_activities))


def test_get_activities_returns_catalog(client):
    # Arrange
    # Nenhuma preparação adicional é necessária.

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert "Programming Class" in data


def test_signup_for_activity_adds_participant(client):
    # Arrange
    email = "newstudent@mergington.edu"
    activity_name = "Chess Club"
    encoded_activity = quote(activity_name)

    # Act
    response = client.post(f"/activities/{encoded_activity}/signup?email={email}")

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for {activity_name}"
    assert email in activities_store[activity_name]["participants"]


def test_signup_duplicate_returns_conflict(client):
    # Arrange
    email = "michael@mergington.edu"
    activity_name = "Chess Club"
    encoded_activity = quote(activity_name)

    # Act
    response = client.post(f"/activities/{encoded_activity}/signup?email={email}")

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_unknown_activity_returns_not_found(client):
    # Arrange
    email = "newstudent@mergington.edu"
    encoded_activity = quote("Unknown Club")

    # Act
    response = client.post(f"/activities/{encoded_activity}/signup?email={email}")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_participant_removes_email(client):
    # Arrange
    email = "michael@mergington.edu"
    activity_name = "Chess Club"
    encoded_activity = quote(activity_name)

    # Act
    response = client.delete(f"/activities/{encoded_activity}/signup?email={email}")

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Unregistered {email} from {activity_name}"
    assert email not in activities_store[activity_name]["participants"]


def test_unregister_unknown_email_returns_bad_request(client):
    # Arrange
    email = "notregistered@mergington.edu"
    activity_name = "Chess Club"
    encoded_activity = quote(activity_name)

    # Act
    response = client.delete(f"/activities/{encoded_activity}/signup?email={email}")

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student not signed up for this activity"
