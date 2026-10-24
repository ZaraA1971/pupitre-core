import io
import json
import urllib.error

import pytest

import cloud_reader as cloud
import server


class FakeAPI:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.requests = []

    def open(self, request, timeout):
        self.requests.append(request)
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return io.BytesIO(json.dumps(response).encode())


def metadata(run_id="run-test-123"):
    return {"id": cloud.AGENT_ID, "name": "Code Vigie", "status": "IDLE",
            "latestRunId": run_id, "private_metadata": "do not expose"}


def test_fixed_agent_get_only_and_result():
    api = FakeAPI(metadata(), {"id": "run-test-123", "status": "FINISHED", "result": "Diagnostic"})
    result = cloud.CloudReader("test-secret", api).latest_result()
    assert result["result"] == "Diagnostic"
    assert result["simulated"] is False
    assert [req.full_url for req in api.requests] == [cloud.BASE_URL, cloud.BASE_URL + "/runs/run-test-123"]
    assert all(req.get_method() == "GET" and req.data is None for req in api.requests)
    assert "private_metadata" not in result


@pytest.mark.parametrize("run_id", ["../../secrets", "https://evil.example", "run-a?x=1", {}, ""])
def test_rejects_untrusted_run_paths(run_id):
    api = FakeAPI(metadata(run_id))
    with pytest.raises(cloud.CloudReadError):
        cloud.CloudReader("test-secret", api).latest_result()
    assert len(api.requests) == 1


def test_rejects_other_agent():
    api = FakeAPI({"id": "other"})
    with pytest.raises(cloud.CloudReadError, match="identity"):
        cloud.CloudReader("test-secret", api).status()


def test_errors_do_not_leak_secret_or_body():
    secret = "do-not-display"
    error = urllib.error.HTTPError(cloud.BASE_URL, 401, secret, {}, io.BytesIO(secret.encode()))
    with pytest.raises(cloud.CloudReadError) as captured:
        cloud.CloudReader(secret, FakeAPI(error)).status()
    assert str(captured.value) == "Cursor API HTTP 401"
    assert secret not in str(captured.value)


def test_redirects_are_refused():
    assert cloud.NoRedirect().redirect_request(None, None, 302, "", {}, "https://evil.example") is None


def test_no_run_does_not_request_a_run():
    api = FakeAPI(metadata(None))
    assert cloud.CloudReader("test-secret", api).latest_result()["run_id"] is None
    assert len(api.requests) == 1


def test_private_key_file_and_disabled_mode(tmp_path, monkeypatch):
    key = tmp_path / "key"
    key.write_text("fake-api-key")
    key.chmod(0o644)
    monkeypatch.setenv("CURSOR_API_KEY_FILE", str(key))
    with pytest.raises(cloud.CloudReadError, match="private"):
        cloud.load_api_key()
    key.chmod(0o600)
    assert cloud.load_api_key() == "fake-api-key"
    monkeypatch.setenv("CURSOR_BRIDGE_MODE", "local_mock")
    with pytest.raises(cloud.CloudReadError, match="disabled"):
        server.cursor_last_result()


def test_server_delegates_only_in_explicit_cloud_mode(monkeypatch):
    monkeypatch.setenv("CURSOR_BRIDGE_MODE", "cloud_readonly")
    api = FakeAPI(metadata())
    monkeypatch.setattr(server, "configured_reader", lambda: cloud.CloudReader("test-secret", api))
    assert server.cursor_status()["status"] == "IDLE"
    assert len(api.requests) == 1
    monkeypatch.setenv("CURSOR_BRIDGE_MODE", "local_mock")
    assert server.cursor_status()["simulated"] is True
    assert len(api.requests) == 1


def test_response_size_is_bounded(monkeypatch):
    monkeypatch.setattr(cloud, "MAX_RESPONSE_BYTES", 10)
    with pytest.raises(cloud.CloudReadError, match="size limit"):
        cloud.CloudReader("test-secret", FakeAPI(metadata())).status()
