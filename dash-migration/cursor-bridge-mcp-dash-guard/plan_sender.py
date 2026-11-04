"""Opt-in plan requests to the approved cloud agent. No automatic retries."""

import json
import os
import re
import urllib.error
import urllib.request

from cloud_reader import BASE_URL, MAX_RESPONSE_BYTES, CloudReadError, CloudReader, load_api_key

PREFIX = (
    "Demande de diagnostic uniquement. Ne modifier aucun fichier, dépôt, service, "
    "secret ou configuration. Ne pas utiliser SSH ni accéder à la production. "
    "Ne pas appliquer de plan, créer de commit ou de PR. Si la demande exige "
    "une modification, expliquer le plan sans l'exécuter.\n\nDemande utilisateur :\n"
)


class PlanSender(CloudReader):
    def send_plan(self, instruction):
        if not isinstance(instruction, str) or not instruction.strip() or len(instruction) > 8000:
            raise CloudReadError("Instruction must contain 1 to 8000 characters")
        agent = self.status()
        if agent['status'] != 'IDLE':
            raise CloudReadError("Agent is not idle; no instruction sent")
        payload = {"prompt": {"text": PREFIX + instruction.strip()}, "mode": "plan", "mcpServers": []}
        request = urllib.request.Request(
            BASE_URL + '/runs', data=json.dumps(payload).encode('utf-8'), method='POST',
            headers={'Authorization': 'Bearer ' + self.key, 'Content-Type': 'application/json',
                     'Accept': 'application/json'},
        )
        try:
            with self.opener.open(request, timeout=20) as response:
                raw = response.read(MAX_RESPONSE_BYTES + 1)
            if len(raw) > MAX_RESPONSE_BYTES:
                raise ValueError('Response too large')
            data = json.loads(raw)
            run = data['run']
            run_id = run['id']
            if not isinstance(run_id, str) or not re.fullmatch(r'run-[A-Za-z0-9-]{1,100}', run_id):
                raise ValueError('Invalid run ID')
            if run.get('agentId') != agent['agent_id']:
                raise ValueError('Invalid agent identity')
            return {'agent_id': agent['agent_id'], 'run_id': run_id,
                    'status': run.get('status'), 'mode': 'plan',
                    'notice': 'Plan mode and instructions do not revoke existing SSH or production permissions.'}
        except urllib.error.HTTPError as error:
            if error.code == 409:
                raise CloudReadError('Agent busy; no retry performed') from None
            raise CloudReadError('Cursor POST HTTP ' + str(error.code) + '; verify latest run before any retry') from None
        except (OSError, ValueError, KeyError, TypeError):
            raise CloudReadError('Submission outcome uncertain; check latest run before any retry') from None

    def run_result(self, run_id):
        if not isinstance(run_id, str) or not re.fullmatch(r'run-[A-Za-z0-9-]{1,100}', run_id):
            raise CloudReadError('Invalid run identifier')
        run = self._get('/runs/' + run_id)
        if run.get('id') != run_id:
            raise CloudReadError('Unexpected run identity')
        if run.get('agentId') not in (None, 'bc-01a10cbc-5519-749c-823d-1785c3eadaf6'):
            raise CloudReadError('Unexpected agent identity')
        return {k: run.get(k) for k in ('id', 'status', 'result')}


def configured_sender():
    if os.getenv('CURSOR_BRIDGE_MODE') != 'cloud_readonly' or os.getenv('CURSOR_BRIDGE_ALLOW_PLAN_SEND') != '1':
        raise CloudReadError('Plan submission is disabled')
    return PlanSender(load_api_key())
