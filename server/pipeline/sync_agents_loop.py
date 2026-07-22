#!/usr/bin/env python3
import time
import sync_agents

print("[sync_agents_loop] Starting agent sync loop...", flush=True)

while True:
    try:
        sync_agents.main()
    except Exception as e:
        print(f"[sync_agents_loop] Error running agent sync: {e}", flush=True)

    time.sleep(5)
