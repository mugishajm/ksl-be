#!/usr/bin/env python3
"""
Smoke test: multiple concurrent API sessions + start ignores stray X-Session-Id.

Run from repository root:

  Windows (PowerShell):
    $env:KSL_E2E_MOCK="1"; .\\.venv\\Scripts\\python.exe tools\\test_multisession_api.py

  Unix:
    KSL_E2E_MOCK=1 python tools/test_multisession_api.py

Requires: Pillow (already in requirements.txt) for a tiny JPEG frame.
"""
from __future__ import annotations

import base64
import io
import os
import sys

# Must be set before api_server import
os.environ["KSL_E2E_MOCK"] = "1"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import api_server  # noqa: E402


def _tiny_jpeg_data_url() -> str:
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (64, 64), color=(40, 40, 40)).save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/jpeg;base64,{b64}"


def main() -> int:
    app = api_server.app
    client = app.test_client()

    r0 = client.get("/api/prediction")
    assert r0.status_code == 400, r0.get_json()
    err0 = (r0.get_json() or {}).get("error", "")
    assert "session_id" in err0.lower(), err0

    r1 = client.post("/api/start", json={"mode": "letter"})
    assert r1.status_code == 200, r1.get_data()
    j1 = r1.get_json()
    assert j1.get("ok") is True, j1
    sid1 = j1["session_id"]

    r2 = client.post("/api/start", json={"mode": "letter"})
    assert r2.status_code == 200, r2.get_data()
    sid2 = r2.get_json()["session_id"]
    assert sid1 != sid2, "two independent starts must get different session_id"

    # New start must NOT bind to X-Session-Id from another tab/client
    r3 = client.post(
        "/api/start",
        json={"mode": "letter"},
        headers={"X-Session-Id": sid1},
    )
    assert r3.status_code == 200, r3.get_data()
    sid3 = r3.get_json()["session_id"]
    assert sid3 != sid1, "POST /api/start must ignore X-Session-Id unless body resumes"

    r_resume = client.post(
        "/api/start",
        json={"mode": "letter", "resume_session_id": sid1},
    )
    assert r_resume.status_code == 200, r_resume.get_data()
    jr = r_resume.get_json()
    assert jr["session_id"] == sid1
    assert jr.get("already_running") is True

    p1 = client.get("/api/prediction", headers={"X-Session-Id": sid1})
    p2 = client.get("/api/prediction", headers={"X-Session-Id": sid2})
    assert p1.status_code == 200 and p2.status_code == 200
    assert (p1.get_json() or {}).get("error") in (None, "")
    assert (p2.get_json() or {}).get("error") in (None, "")

    img = _tiny_jpeg_data_url()
    af1 = client.post(
        "/api/analyze-frame",
        json={"image": img, "session_id": sid1},
        headers={"X-Session-Id": sid1},
    )
    assert af1.status_code == 200, af1.get_data()
    body = af1.get_json() or {}
    assert body.get("ok") is True
    assert body.get("current_letter")

    client.post("/api/stop", headers={"X-Session-Id": sid1})
    p_gone = client.get("/api/prediction", headers={"X-Session-Id": sid1})
    assert p_gone.status_code == 200
    assert "expired" in (p_gone.get_json() or {}).get("error", "").lower() or "unknown" in (
        p_gone.get_json() or {}
    ).get("error", "").lower()

    p2_after = client.get("/api/prediction", headers={"X-Session-Id": sid2})
    assert p2_after.status_code == 200
    assert (p2_after.get_json() or {}).get("error") in (None, "")

    print("OK — multi-session API smoke test passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
