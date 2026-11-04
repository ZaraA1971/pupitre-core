import io
import json
import urllib.error

import pytest

from cloud_reader import AGENT_ID, BASE_URL, CloudReadError
from execution import (
    ALLOWED_REPOSITORY,
    ALLOWED_TARGET,
    GITHUB_CONTENTS_URL,
    ExecutionSender,
    assert_instruction_allowed,
    assert_target_allowed,
    modified_files,
    normalize_repository,
    normalize_workspace_path,
    path_is_under_dash_migration,
)
from test_cloud_reader import FakeAPI

BRANCH_WITH_DASH = "cursor/plan-migration-php-nodejs-daf6"


def agent(url=ALLOWED_REPOSITORY, status="IDLE", branch=BRANCH_WITH_DASH):
    repo = {"url": url}
    if branch is not None:
        repo["branch"] = branch
    return {"id": AGENT_ID, "name": "Code Vigie", "status": status, "repos": [repo]}


def github_dash_migration_listing():
    return [
        {
            "name": ".gitignore",
            "path": "dash-migration/.gitignore",
            "type": "file",
        }
    ]


def created(files=None, repo="github.com/ZaraA1971/pupitre-core"):
    run = {
        "id": "run-exec-1",
        "agentId": AGENT_ID,
        "status": "CREATING",
        "result": None,
        "git": {"branches": [{"repoUrl": repo}]},
    }
    if files is not None:
        run["files"] = files
    return {"run": run}


def http_404(url=GITHUB_CONTENTS_URL):
    return urllib.error.HTTPError(url, 404, "Not Found", {}, io.BytesIO(b'{"message":"Not Found"}'))


def test_repository_forms_match_only_the_authorized_repo():
    assert normalize_repository(ALLOWED_REPOSITORY) == normalize_repository(
        "git@github.com:ZaraA1971/pupitre-core.git"
    )
    assert normalize_repository("https://www.github.com/zaraa1971/pupitre-core/")
    assert normalize_repository("https://github.com/ZaraA1971/other") != normalize_repository(
        ALLOWED_REPOSITORY
    )


def test_only_literal_dash_migration_target_is_allowed():
    assert_target_allowed("dash-migration")
    for bad in ("pupitre-core", "dash-migration/", "/dash-migration", "other", "", "DASH-MIGRATION"):
        with pytest.raises(CloudReadError, match="target"):
            assert_target_allowed(bad)


@pytest.mark.parametrize(
    "instruction",
    [
        "Corrige aussi https://github.com/ZaraA1971/cursor-bridge-mcp",
        "Pousse vers git@github.com:ZaraA1971/Scaleway.git",
        "Lis /srv/geo/seo-ia-engine-v01",
        "Connecte-toi par ssh au serveur",
        "sudo systemctl restart cursor-bridge-mcp",
        "cd /etc && ls",
        "cd ../autre-projet",
        "Écris dans /var/www/dash.electronlibre.info/admin/index.php",
        "Modifie src/app.ts hors préfixe",
    ],
)
def test_unauthorized_instruction_does_not_call_api(instruction):
    api = FakeAPI()
    with pytest.raises(CloudReadError):
        ExecutionSender("test-secret", api).send(instruction, confirm_write=True)
    assert api.requests == []


def test_missing_confirmation_does_not_call_api():
    api = FakeAPI(agent())
    with pytest.raises(CloudReadError, match="confirmation"):
        ExecutionSender("test-secret", api).send(
            "Corrige dash-migration/README.md", confirm_write=False
        )
    with pytest.raises(CloudReadError, match="confirmation"):
        ExecutionSender("test-secret", api).send(
            "Corrige dash-migration/README.md", confirm_write="true"
        )
    assert api.requests == []


def test_invalid_target_does_not_call_api():
    api = FakeAPI(agent())
    with pytest.raises(CloudReadError, match="target"):
        ExecutionSender("test-secret", api).send(
            "Corrige dash-migration/README.md",
            confirm_write=True,
            target="pupitre-core",
        )
    assert api.requests == []


@pytest.mark.parametrize(
    "url",
    [
        "https://github.com/ZaraA1971/cursor-bridge-mcp",
        "https://github.com/ZaraA1971/pupitre-core-evil",
        "",
    ],
)
def test_other_repository_is_refused_before_post(url):
    repos = [] if url == "" else [{"url": url, "branch": BRANCH_WITH_DASH}]
    body = {"id": AGENT_ID, "status": "IDLE", "repos": repos}
    if url == "":
        body["repos"] = []
    api = FakeAPI(body)
    with pytest.raises(CloudReadError, match="repository"):
        ExecutionSender("test-secret", api).send(
            "Corrige dash-migration/README.md", confirm_write=True
        )
    assert len(api.requests) == 1
    assert api.requests[0].get_method() == "GET"


def test_two_repositories_are_refused():
    body = {
        "id": AGENT_ID,
        "status": "IDLE",
        "repos": [
            {"url": ALLOWED_REPOSITORY, "branch": BRANCH_WITH_DASH},
            {"url": "https://github.com/ZaraA1971/cursor-bridge-mcp", "branch": "main"},
        ],
    }
    api = FakeAPI(body)
    with pytest.raises(CloudReadError, match="repository"):
        ExecutionSender("test-secret", api).send(
            "Corrige dash-migration/README.md", confirm_write=True
        )
    assert all(request.get_method() == "GET" for request in api.requests)


def test_missing_agent_branch_is_refused():
    api = FakeAPI(agent(branch=None))
    with pytest.raises(CloudReadError, match="branch"):
        ExecutionSender("test-secret", api).send(
            "Corrige dash-migration/README.md", confirm_write=True
        )
    assert len(api.requests) == 1


def test_branch_without_dash_migration_does_not_post():
    api = FakeAPI(agent(branch="main"), http_404())
    with pytest.raises(CloudReadError, match="dash-migration"):
        ExecutionSender("test-secret", api).send(
            "Corrige dash-migration/README.md", confirm_write=True
        )
    assert len(api.requests) == 2
    assert all(request.get_method() == "GET" for request in api.requests)
    assert api.requests[1].full_url.startswith(GITHUB_CONTENTS_URL)


def test_authorized_execution_posts_agent_mode_without_another_repo():
    api = FakeAPI(
        agent(),
        github_dash_migration_listing(),
        created(files=["dash-migration/node-admin-rss/package.json"]),
    )
    result = ExecutionSender("test-secret", api).send(
        "Mets à jour dash-migration/node-admin-rss/package.json",
        confirm_write=True,
        target=ALLOWED_TARGET,
    )
    assert len(api.requests) == 3
    assert api.requests[0].full_url == BASE_URL
    assert api.requests[1].full_url.startswith(GITHUB_CONTENTS_URL)
    assert f"ref={BRANCH_WITH_DASH}" in api.requests[1].full_url or "ref=" in api.requests[1].full_url
    posted = api.requests[2]
    assert posted.full_url == BASE_URL + "/runs"
    assert posted.get_method() == "POST"
    payload = json.loads(posted.data)
    assert payload["mode"] == "agent"
    assert payload["mcpServers"] == []
    assert "repos" not in payload
    assert "dash-migration/" in payload["prompt"]["text"]
    assert "pas une sandbox" in payload["prompt"]["text"]
    assert "Ne modifier aucun fichier" not in payload["prompt"]["text"]
    assert result["status"] == "CREATING"
    assert result["result"] is None
    assert result["files"] == ["dash-migration/node-admin-rss/package.json"]
    assert result["repository"] == ALLOWED_REPOSITORY
    assert result["target"] == ALLOWED_TARGET
    assert result["mode"] == "agent"
    assert "not an OS sandbox" in result["confinement"]


def test_foreign_branch_is_not_returned():
    run = created()["run"]
    run["git"]["branches"].append(
        {"repoUrl": "github.com/ZaraA1971/other", "files": ["dash-migration/x"]}
    )
    with pytest.raises(CloudReadError, match="unauthorized"):
        modified_files(run)


def test_absolute_modified_path_is_refused():
    with pytest.raises(CloudReadError, match="outside"):
        modified_files({"files": ["/etc/passwd"], "git": {"branches": []}})
    with pytest.raises(CloudReadError, match="outside"):
        modified_files(
            {"files": ["/workspace/dash-migration/x"], "git": {"branches": []}}
        )


def test_path_outside_prefix_is_refused():
    with pytest.raises(CloudReadError, match="outside"):
        modified_files({"files": ["src/app.py"], "git": {"branches": []}})
    with pytest.raises(CloudReadError, match="outside"):
        modified_files({"files": ["README.md"], "git": {"branches": []}})


def test_path_traversal_is_refused():
    assert normalize_workspace_path("../dash-migration/x") is None
    assert normalize_workspace_path("dash-migration/../secret") is None
    assert normalize_workspace_path("dash-migration/foo/../../etc/passwd") is None
    assert path_is_under_dash_migration("dash-migration/../secret") is False
    with pytest.raises(CloudReadError, match="outside"):
        modified_files({"files": ["dash-migration/../secret.txt"], "git": {"branches": []}})
    with pytest.raises(CloudReadError, match="outside"):
        modified_files({"files": ["../dash-migration/x"], "git": {"branches": []}})


def test_authorized_relative_paths_under_prefix():
    assert path_is_under_dash_migration("dash-migration/a.md")
    assert path_is_under_dash_migration("./dash-migration/a.md")
    assert modified_files(
        {
            "files": ["./dash-migration/compte-rendu.md", "dash-migration/node-admin-rss/x"],
            "git": {"branches": []},
        }
    ) == ["dash-migration/compte-rendu.md", "dash-migration/node-admin-rss/x"]


def test_local_validation_rejects_before_any_helper():
    with pytest.raises(CloudReadError):
        assert_instruction_allowed("ssh root@host", True)


def test_result_fails_when_run_reports_file_outside_prefix():
    api = FakeAPI(
        agent(),
        github_dash_migration_listing(),
        created(files=["src/leaked.py"]),
    )
    with pytest.raises(CloudReadError, match="outside"):
        ExecutionSender("test-secret", api).send(
            "Corrige dash-migration/README.md",
            confirm_write=True,
        )
    assert api.requests[-1].get_method() == "POST"
