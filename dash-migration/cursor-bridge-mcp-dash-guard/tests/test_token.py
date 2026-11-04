"""Token gate and startup guards. No network, no Cursor."""

import asyncio
import os
import subprocess
import sys
from pathlib import Path

import pytest

import server

ROOT = Path(__file__).resolve().parents[1]
TOKEN = "a" * 32


def test_bind_address_is_loopback():
    assert server.HOST == "127.0.0.1"
    assert server.DEFAULT_PORT == 8815


def test_tokens_equal_ignores_length_difference():
    assert server.tokens_equal(TOKEN, TOKEN)
    assert not server.tokens_equal(TOKEN, "b" * 32)
    assert not server.tokens_equal("short", TOKEN)


def test_load_token_rejects_short_value():
    with pytest.raises(RuntimeError, match="32"):
        server.load_token("too-short")
    assert server.load_token("  " + TOKEN + "  ") == TOKEN


def _run_server(env):
    return subprocess.run(
        [sys.executable, "server.py"],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=10,
    )


def test_disabled_without_mode():
    env = dict(os.environ)
    env.pop("CURSOR_BRIDGE_MODE", None)
    env["MCP_TOKEN"] = TOKEN
    proc = _run_server(env)
    assert proc.returncode != 0
    assert "Disabled" in proc.stderr
    assert TOKEN not in proc.stderr


def test_short_token_refuses_to_start():
    env = dict(os.environ)
    env["CURSOR_BRIDGE_MODE"] = "local_mock"
    env["MCP_TOKEN"] = "short"
    proc = _run_server(env)
    assert proc.returncode != 0
    assert "MCP_TOKEN" in proc.stderr


def test_invalid_port_refuses_to_start():
    env = dict(os.environ)
    env["CURSOR_BRIDGE_MODE"] = "local_mock"
    env["MCP_TOKEN"] = TOKEN
    env["PORT"] = "0"
    proc = _run_server(env)
    assert proc.returncode != 0
    assert "Invalid PORT" in proc.stderr


def _scope(path, headers=None):
    return {
        "type": "http",
        "http_version": "1.1",
        "method": "POST",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": [
            (key.lower().encode("ascii"), value.encode("latin-1"))
            for key, value in (headers or {}).items()
        ],
        "scheme": "http",
        "client": ("127.0.0.1", 9),
        "server": ("127.0.0.1", 8815),
    }


async def _call(app, path, headers=None):
    seen = {}

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message):
        if message["type"] == "http.response.start":
            seen["status"] = message["status"]
            seen["headers"] = message.get("headers", [])
        elif message["type"] == "http.response.body":
            seen["body"] = message.get("body", b"")

    await app(_scope(path, headers), receive, send)
    return seen


def test_gate_accepts_bearer_and_path_and_hides_the_rest():
    forwarded = []

    async def inner(scope, receive, send):
        forwarded.append(scope["path"])
        await server._response(200, {"ok": True})(scope, receive, send)

    gate = server.TokenGate(inner, TOKEN)

    async def checks():
        missing = await _call(gate, "/mcp")
        assert missing["status"] == 401
        header_map = {key.lower(): value for key, value in missing["headers"]}
        assert header_map[b"www-authenticate"] == b"Bearer"
        assert TOKEN.encode() not in missing["body"]

        wrong = await _call(gate, "/mcp", {"authorization": "Bearer " + ("c" * 32)})
        assert wrong["status"] == 401

        ok = await _call(gate, "/mcp", {"authorization": "Bearer " + TOKEN})
        assert ok["status"] == 200

        hidden = await _call(gate, "/t/not-the-secret/mcp")
        assert hidden["status"] == 404
        assert TOKEN.encode() not in hidden["body"]

        via_path = await _call(gate, f"/t/{TOKEN}/mcp")
        assert via_path["status"] == 200

        other = await _call(gate, "/health")
        assert other["status"] == 404
        assert forwarded == ["/mcp", "/mcp"]

        lifespan = {"type": "lifespan"}

        async def receive_life():
            return {"type": "lifespan.startup"}

        sent = []

        async def send_life(message):
            sent.append(message["type"])

        async def life_app(scope, receive, send):
            assert scope["type"] == "lifespan"
            message = await receive()
            assert message["type"] == "lifespan.startup"
            await send({"type": "lifespan.startup.complete"})

        await server.TokenGate(life_app, TOKEN)(lifespan, receive_life, send_life)
        assert sent == ["lifespan.startup.complete"]

    asyncio.run(checks())
