"""Official MCP client over loopback Streamable HTTP."""

import asyncio
import json
import os
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import httpx
import pytest
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

ROOT = Path(__file__).resolve().parents[1]
TOKEN = "d" * 32
EXPECTED = {
    "agent_id": "bc-01a10cbc-5519-749c-823d-1785c3eadaf6",
    "status": "READY_MOCK",
    "simulated": True,
}


def _free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


@pytest.fixture(scope="module")
def local_server():
    port = _free_port()
    env = dict(os.environ)
    env["CURSOR_BRIDGE_MODE"] = "local_mock"
    env["MCP_TOKEN"] = TOKEN
    env["PORT"] = str(port)
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    log = tempfile.TemporaryFile()
    proc = subprocess.Popen(
        [sys.executable, "server.py"],
        cwd=ROOT,
        env=env,
        stdout=log,
        stderr=log,
    )
    base = f"http://127.0.0.1:{port}"
    try:
        deadline = time.time() + 5
        while time.time() < deadline:
            if proc.poll() is not None:
                log.seek(0)
                raise RuntimeError(log.read().decode(errors="replace")[-2000:])
            with socket.socket() as sock:
                sock.settimeout(0.1)
                if sock.connect_ex(("127.0.0.1", port)) == 0:
                    break
            time.sleep(0.05)
        else:
            raise RuntimeError("MCP server did not start")
        yield base
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=5)
        log.close()


def decode_result(result):
    if result.structuredContent is not None:
        return result.structuredContent
    return json.loads(result.content[0].text)


async def _session_checks(url, headers=None):
    async with streamablehttp_client(url, headers=headers) as (read, write, _):
        async with ClientSession(read, write) as session:
            init = await session.initialize()
            assert init.serverInfo.name == "cursor-bridge-mock"
            tools = (await session.list_tools()).tools
            assert [tool.name for tool in tools] == ["cursor_status", "cursor_last_result"]
            assert tools[0].inputSchema.get("properties", {}) == {}

            result = await session.call_tool("cursor_status", {})
            assert not result.isError
            assert decode_result(result) == EXPECTED

            denied = await session.call_tool("cursor_send", {"mission": "test"})
            assert denied.isError

            wrong_args = await session.call_tool(
                "cursor_status",
                {"agent_id": "different"},
            )
            assert not wrong_args.isError
            assert decode_result(wrong_args) == EXPECTED


def test_http_gate(local_server):
    missing = httpx.post(f"{local_server}/mcp", json={"jsonrpc": "2.0"})
    assert missing.status_code == 401
    assert missing.headers["www-authenticate"] == "Bearer"
    assert TOKEN not in missing.text

    bad = httpx.post(f"{local_server}/t/not-the-secret/mcp", json={"jsonrpc": "2.0"})
    assert bad.status_code == 404
    assert TOKEN not in bad.text

    other = httpx.get(f"{local_server}/")
    assert other.status_code == 404


def test_real_mcp_client(local_server):
    asyncio.run(
        _session_checks(
            f"{local_server}/mcp",
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
    )
    asyncio.run(_session_checks(f"{local_server}/t/{TOKEN}/mcp"))
