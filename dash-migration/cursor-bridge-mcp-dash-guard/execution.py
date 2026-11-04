"""Opt-in execution scoped to the dash-migration workspace inside pupitre-core.

Post-condition only: modified_files() inspects paths reported after a run.
It is not an OS sandbox and cannot undo or prevent out-of-tree writes the
agent may already have performed. Rely on the prompt prefix and pre-flight
checks; treat modified_files as a detection guard, not confinement.
"""

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

from cloud_reader import AGENT_ID, BASE_URL, MAX_RESPONSE_BYTES, CloudReadError, CloudReader, load_api_key

ALLOWED_REPOSITORY = "https://github.com/ZaraA1971/pupitre-core"
ALLOWED_KEY = "github.com/zaraa1971/pupitre-core"
ALLOWED_TARGET = "dash-migration"
PATH_PREFIX = "dash-migration/"
GITHUB_CONTENTS_URL = (
    "https://api.github.com/repos/ZaraA1971/pupitre-core/contents/dash-migration"
)
REPO_IN_TEXT = re.compile(
    r"git@github\.com:[\w.-]+/[\w.-]+"
    r"|https?://(?:www\.)?github\.com/[\w.-]+/[\w.-]+"
    r"|(?<![\w/])github\.com/[\w.-]+/[\w.-]+",
    re.IGNORECASE,
)
OUTSIDE_WORKSPACE = re.compile(
    r"(?:^|[\s`'\"])/(?:srv|etc|root|home|opt|usr|var|bin|tmp|workspace)(?:/|\b)"
    r"|\bssh\b|\bscp\b|\bsudo\b|\bcd\s+\.\.|\bcd\s+/",
    re.IGNORECASE,
)
# Relative paths mentioned in the instruction that are clearly outside the prefix.
RELATIVE_PATH_IN_TEXT = re.compile(
    r"(?<![\w./-])((?:\.\./)?(?:[A-Za-z0-9_.-]+/)+[A-Za-z0-9_.-]+)"
)
PREFIX = (
    "Exécution autorisée uniquement dans le sous-arbre dash-migration/ du dépôt "
    "https://github.com/ZaraA1971/pupitre-core. "
    "Tu peux lire le dépôt pour le contexte, mais tu ne dois modifier que des fichiers "
    "sous dash-migration/. "
    "Ne modifie aucun autre chemin du dépôt. "
    "N'ouvre aucun autre dépôt. "
    "N'accède pas à /var/www/dash.electronlibre.info (lecture seule / hors périmètre d'écriture). "
    "N'utilise pas SSH, sudo, ni de shell root. "
    "N'exécute aucune commande hors de ce workspace isolé. "
    "Ce message est une consigne, pas une sandbox système.\n\n"
    "Mission :\n"
)


def normalize_repository(value):
    if not isinstance(value, str):
        return None
    text = value.strip().rstrip("/")
    text = re.sub(r"\.git$", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^git@github\.com:", "https://github.com/", text, flags=re.IGNORECASE)
    text = re.sub(r"^ssh://git@github\.com/", "https://github.com/", text, flags=re.IGNORECASE)
    text = re.sub(r"^https?://", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^www\.", "", text, flags=re.IGNORECASE)
    parts = text.lower().split("/")
    if len(parts) < 3 or parts[0] != "github.com" or not parts[1] or not parts[2]:
        return None
    return "github.com/" + parts[1] + "/" + parts[2]


def assert_target_allowed(target):
    if target != ALLOWED_TARGET:
        raise CloudReadError("Unauthorized execution target")


def normalize_workspace_path(value):
    """Return a normalized relative path, or None if unsafe / absolute / traversal."""
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip().replace("\\", "/")
    if text.startswith("/") or text.startswith("~"):
        return None
    while text.startswith("./"):
        text = text[2:]
    if not text or text in (".", ".."):
        return None
    parts = [p for p in text.split("/") if p not in ("", ".")]
    if not parts or any(p == ".." for p in parts):
        return None
    return "/".join(parts)


def path_is_under_dash_migration(value):
    normalized = normalize_workspace_path(value)
    if normalized is None:
        return False
    return normalized == ALLOWED_TARGET or normalized.startswith(PATH_PREFIX)


def assert_instruction_allowed(instruction, confirm_write):
    if confirm_write is not True:
        raise CloudReadError("Explicit confirmation is required before execution")
    if not isinstance(instruction, str) or not instruction.strip() or len(instruction) > 8000:
        raise CloudReadError("Instruction must contain 1 to 8000 characters")
    if OUTSIDE_WORKSPACE.search(instruction):
        raise CloudReadError("Instruction leaves the authorized workspace")
    for match in REPO_IN_TEXT.findall(instruction):
        if normalize_repository(match) != ALLOWED_KEY:
            raise CloudReadError("Instruction names an unauthorized repository")
    for match in RELATIVE_PATH_IN_TEXT.findall(instruction):
        # Ignore URLs already handled; require file-like relative paths under prefix.
        if "://" in match:
            continue
        if not path_is_under_dash_migration(match):
            raise CloudReadError("Instruction names a path outside dash-migration")


def assert_agent_repository(agent):
    if agent.get("id") != AGENT_ID:
        raise CloudReadError("Unexpected Cursor agent identity")
    repos = agent.get("repos")
    if not isinstance(repos, list) or len(repos) != 1 or not isinstance(repos[0], dict):
        raise CloudReadError("Unauthorized repository scope")
    if normalize_repository(repos[0].get("url")) != ALLOWED_KEY:
        raise CloudReadError("Unauthorized repository scope")


def agent_branch(agent):
    repo = agent.get("repos")[0]
    for key in ("branch", "ref"):
        value = repo.get(key)
        if isinstance(value, str) and value.strip():
            branch = value.strip()
            if (
                ".." in branch
                or branch.startswith("/")
                or branch.startswith("~")
                or len(branch) > 200
                or any(c.isspace() for c in branch)
            ):
                raise CloudReadError("Agent branch is invalid")
            return branch
    raise CloudReadError("Agent branch is unknown; cannot verify dash-migration")


def assert_dash_migration_on_branch(agent, opener):
    """Verify via public GitHub contents API that ref contains dash-migration/."""
    assert_agent_repository(agent)
    branch = agent_branch(agent)
    query = urllib.parse.urlencode({"ref": branch})
    request = urllib.request.Request(
        GITHUB_CONTENTS_URL + "?" + query,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "cursor-bridge-mcp-dash-guard",
        },
        method="GET",
    )
    try:
        with opener.open(request, timeout=15) as response:
            raw = response.read(MAX_RESPONSE_BYTES + 1)
        if len(raw) > MAX_RESPONSE_BYTES:
            raise CloudReadError("GitHub response exceeds size limit")
        data = json.loads(raw)
    except CloudReadError:
        raise
    except urllib.error.HTTPError as error:
        if error.code == 404:
            raise CloudReadError("Agent branch does not contain dash-migration") from None
        raise CloudReadError(
            "Unable to verify dash-migration on agent branch (HTTP "
            + str(error.code)
            + ")"
        ) from None
    except (OSError, ValueError):
        raise CloudReadError("Unable to verify dash-migration on agent branch") from None
    if not isinstance(data, list) or not data:
        raise CloudReadError("Agent branch does not contain dash-migration")


def modified_files(run):
    """Post-run path check only — not a sandbox (see module docstring)."""
    files = []

    def add(value):
        if isinstance(value, str) and value.strip() and value not in files:
            if not path_is_under_dash_migration(value):
                raise CloudReadError("Modified path is outside the authorized workspace")
            files.append(normalize_workspace_path(value))
        elif isinstance(value, dict) and isinstance(value.get("path"), str):
            add(value["path"])

    for key in ("files", "modifiedFiles"):
        listed = run.get(key)
        if isinstance(listed, list):
            for item in listed:
                add(item)
    branches = run.get("git", {}).get("branches", []) if isinstance(run.get("git"), dict) else []
    if not isinstance(branches, list):
        raise CloudReadError("Invalid Cursor git metadata")
    for branch in branches:
        if not isinstance(branch, dict):
            raise CloudReadError("Invalid Cursor git metadata")
        repo = normalize_repository(branch.get("repoUrl", ""))
        if repo is not None and repo != ALLOWED_KEY:
            raise CloudReadError("Run touched an unauthorized repository")
        for key in ("files", "modifiedFiles", "changedFiles"):
            listed = branch.get(key)
            if isinstance(listed, list):
                for item in listed:
                    add(item)
    return files


class ExecutionSender(CloudReader):
    def send(self, instruction, confirm_write=False, target=ALLOWED_TARGET):
        assert_target_allowed(target)
        assert_instruction_allowed(instruction, confirm_write)
        agent = self._get()
        assert_agent_repository(agent)
        assert_dash_migration_on_branch(agent, self.opener)
        if agent.get("status") != "IDLE":
            raise CloudReadError("Agent is not idle; no instruction sent")
        payload = {
            "prompt": {"text": PREFIX + instruction.strip()},
            "mode": "agent",
            "mcpServers": [],
        }
        if "repos" in payload or payload["mode"] != "agent":
            raise CloudReadError("Execution payload is not allowed")
        request = self._request(payload)
        try:
            with self.opener.open(request, timeout=20) as response:
                raw = response.read(MAX_RESPONSE_BYTES + 1)
            if len(raw) > MAX_RESPONSE_BYTES:
                raise ValueError("Response too large")
            data = json.loads(raw)
            run = data["run"]
            return self._checked_result(run, agent_id=agent["id"])
        except CloudReadError:
            raise
        except Exception as error:
            self._raise_submission_error(error)

    def _request(self, payload):
        return urllib.request.Request(
            BASE_URL + "/runs",
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={
                "Authorization": "Bearer " + self.key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )

    def _checked_result(self, run, agent_id):
        run_id = run.get("id")
        if not isinstance(run_id, str) or not re.fullmatch(r"run-[A-Za-z0-9-]{1,100}", run_id):
            raise CloudReadError("Invalid run identifier")
        if run.get("agentId") not in (None, agent_id):
            raise CloudReadError("Unexpected agent identity")
        result = run.get("result")
        if result is not None and not isinstance(result, str):
            raise CloudReadError("Invalid Cursor result format")
        return {
            "agent_id": agent_id,
            "run_id": run_id,
            "status": run.get("status"),
            "result": result,
            "files": modified_files(run),
            "repository": ALLOWED_REPOSITORY,
            "target": ALLOWED_TARGET,
            "path_prefix": PATH_PREFIX,
            "mode": "agent",
            "confinement": (
                "prompt_and_postcheck_only; modified_files is not an OS sandbox"
            ),
        }

    def _raise_submission_error(self, error):
        if isinstance(error, urllib.error.HTTPError):
            if error.code == 409:
                raise CloudReadError("Agent busy; no retry performed") from None
            raise CloudReadError(
                "Cursor POST HTTP " + str(error.code) + "; verify latest run before any retry"
            ) from None
        raise CloudReadError("Submission outcome uncertain; check latest run before any retry") from None


def configured_execution():
    if os.getenv("CURSOR_BRIDGE_MODE") != "cloud_readonly" or os.getenv("CURSOR_BRIDGE_ALLOW_EXECUTION") != "1":
        raise CloudReadError("Execution is disabled")
    return ExecutionSender(load_api_key())
