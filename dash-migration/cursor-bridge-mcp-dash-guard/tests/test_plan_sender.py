import json
import urllib.error

import pytest

from cloud_reader import AGENT_ID, BASE_URL, CloudReadError
from plan_sender import PlanSender, configured_sender
from test_cloud_reader import FakeAPI, metadata


def test_sends_only_plan_to_fixed_agent():
    api = FakeAPI(metadata(), {'run': {'id': 'run-new', 'agentId': AGENT_ID, 'status': 'CREATING'}})
    result = PlanSender('test-secret', api).send_plan('Explique le projet')
    request = api.requests[1]
    assert request.full_url == BASE_URL + '/runs'
    assert request.get_method() == 'POST'
    payload = json.loads(request.data)
    assert payload['mode'] == 'plan' and payload['mcpServers'] == []
    assert 'Ne pas utiliser SSH' in payload['prompt']['text']
    assert result['run_id'] == 'run-new'


@pytest.mark.parametrize('value', ['', ' ', 'x' * 8001, None])
def test_bad_instructions_do_not_call_api(value):
    api = FakeAPI()
    with pytest.raises(CloudReadError):
        PlanSender('test-secret', api).send_plan(value)
    assert not api.requests


def test_busy_does_not_send():
    agent = metadata(); agent['status'] = 'ACTIVE'
    api = FakeAPI(agent)
    with pytest.raises(CloudReadError, match='not idle'):
        PlanSender('test-secret', api).send_plan('Diagnostic')
    assert len(api.requests) == 1


@pytest.mark.parametrize('error', [TimeoutError('test-secret'), urllib.error.HTTPError(BASE_URL, 409, 'test-secret', {}, None)])
def test_submission_is_never_retried(error):
    api = FakeAPI(metadata(), error)
    with pytest.raises(CloudReadError) as captured:
        PlanSender('test-secret', api).send_plan('Diagnostic')
    assert len(api.requests) == 2
    assert 'test-secret' not in str(captured.value)


def test_opt_in_is_required(monkeypatch):
    monkeypatch.setenv('CURSOR_BRIDGE_MODE', 'cloud_readonly')
    monkeypatch.delenv('CURSOR_BRIDGE_ALLOW_PLAN_SEND', raising=False)
    with pytest.raises(CloudReadError, match='disabled'):
        configured_sender()


def test_tracks_the_submitted_run_instead_of_latest():
    api = FakeAPI({'id': 'run-original', 'status': 'FINISHED', 'result': 'Réponse'})
    assert PlanSender('test-secret', api).run_result('run-original')['result'] == 'Réponse'
    assert api.requests[0].full_url.endswith('/runs/run-original')


def test_invalid_run_does_not_call_api():
    api = FakeAPI()
    with pytest.raises(CloudReadError):
        PlanSender('test-secret', api).run_result('../other')
    assert not api.requests
