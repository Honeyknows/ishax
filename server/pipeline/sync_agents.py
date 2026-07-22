#!/usr/bin/env python3
"""
ISHA-X EDR — sync_agents.py
============================
Queries Wazuh REST API for registered agents and syncs them to master.db.
"""

import os
import sqlite3
import sys
import json
import re
from pathlib import Path
import time


# Load .env from backend folder
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / "backend" / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

WAZUH_API_BASE = os.getenv("WAZUH_API_BASE", "https://localhost:55000")
WAZUH_API_USER = os.getenv("WAZUH_API_USER", "wazuh-wui")
WAZUH_API_PASS = os.getenv("WAZUH_API_PASS", "MyS3cr37P450r.*-")
MASTER_DB_PATH = Path(__file__).parent / "master.db"

def get_wazuh_token() -> str:
    import urllib.request, base64, ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    creds = base64.b64encode(f"{WAZUH_API_USER}:{WAZUH_API_PASS}".encode()).decode()
    url = f"{WAZUH_API_BASE}/security/user/authenticate"
    req = urllib.request.Request(url, method="GET", headers={"Authorization": f"Basic {creds}"})
    with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
        data = json.loads(resp.read())
        return data["data"]["token"]

def get_wazuh_agents(token: str) -> list[dict]:
    import urllib.request, ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    url = f"{WAZUH_API_BASE}/agents?limit=500&select=id,name,status"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
        data = json.loads(resp.read())
        return data.get("data", {}).get("affected_items", [])

def get_master_con() -> sqlite3.Connection:
    con = sqlite3.connect(str(MASTER_DB_PATH), check_same_thread=False, timeout=30.0)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    return con

def get_admin_tenant_id(con: sqlite3.Connection) -> str | None:
    row = con.execute("SELECT id FROM tenants WHERE is_active = 1 ORDER BY created_at ASC LIMIT 1").fetchone()
    return row["id"] if row else None

def get_registered_agent_ids(con: sqlite3.Connection) -> set[str]:
    rows = con.execute("SELECT agent_id FROM agents WHERE is_revoked = 0").fetchall()
    return {row["agent_id"] for row in rows}

def register_agent(con: sqlite3.Connection, agent_id: str, agent_name: str, tenant_id: str):
    import time
    for attempt in range(5):
        try:
            con.execute(
                "INSERT OR IGNORE INTO agents (agent_id, tenant_id, agent_name) VALUES (?, ?, ?)",
                (agent_id, tenant_id, agent_name),
            )
            con.commit()
            return
        except sqlite3.OperationalError as e:
            if "locked" in str(e).lower() and attempt < 4:
                time.sleep(0.5)
                continue
            raise

def main():
    if not MASTER_DB_PATH.exists():
        print(f"[sync_agents] master.db not found at {MASTER_DB_PATH} — skipping sync", flush=True)
        return

    try:
        con = get_master_con()
    except Exception as e:
        print(f"[sync_agents] Cannot open master.db: {e}", flush=True)
        return

    admin_tenant = get_admin_tenant_id(con)
    if not admin_tenant:
        print("[sync_agents] No active tenant found in master.db — skipping sync", flush=True)
        con.close()
        return

    registered = get_registered_agent_ids(con)

    try:
        token = get_wazuh_token()
        wazuh_agents = get_wazuh_agents(token)
    except Exception as e:
        print(f"[sync_agents] Wazuh API not reachable: {e}", flush=True)
        con.close()
        return

    synced = 0
    for agent in wazuh_agents:
        agent_id = str(agent.get("id", "")).zfill(3)
        agent_name = agent.get("name", agent_id)

        if agent_id == "000":
            continue

        if agent.get("status") == "active":
            con.execute("UPDATE agents SET last_seen_at = ? WHERE agent_id = ?", (int(time.time()), agent_id))
            con.commit()

        if agent_id not in registered:
            m = re.match(r"^ishax-(tenant_[a-fA-F0-9]+)-(.*)$", agent_name, re.IGNORECASE)
            tenant_id = m.group(1) if m else admin_tenant
            
            register_agent(con, agent_id, agent_name, tenant_id)
            print(f"[sync_agents] [OK] Registered agent {agent_id} ({agent_name}) -> tenant {tenant_id}", flush=True)
            synced += 1


    con.close()
    if synced > 0:
        print(f"[sync_agents] Sync complete: {synced} new agent(s) registered", flush=True)

if __name__ == "__main__":
    main()
