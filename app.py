"""ScopeSaathi AI: freelancer project-clarity assistant.
Supports local llama.cpp inference or hosted OpenRouter inference via environment settings.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import threading
import time
import webbrowser
from pathlib import Path
from typing import Any

import requests
from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
DEFAULT_MODEL = MODEL_DIR / "Qwen3.5-0.8B-Q4_0.gguf"
MODEL_PATH = Path(os.getenv("SCOPESAATHI_MODEL_PATH", str(DEFAULT_MODEL))).expanduser()
LLAMA_BASE_URL = "http://127.0.0.1:8080"
CHAT_URL = f"{LLAMA_BASE_URL}/v1/chat/completions"
MODEL_ALIAS = "scopesaathi-local"
AI_PROVIDER = os.getenv("AI_PROVIDER", "local").strip().lower()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free").strip() or "openrouter/free"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_PROCESS: subprocess.Popen | None = None
MODEL_START_LOCK = threading.Lock()

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024  # Briefs are limited to 1 MB.

SYSTEM_PROMPT = """You are ScopeSaathi AI, a careful project-scope assistant for freelancers.
Analyse only the client message supplied by the user. Do not invent facts, prices,
deadlines, features, or promises. Distinguish what the client explicitly said from
what is missing or risky. Be helpful, neutral, concise, and easy to understand.
Return ONE valid JSON object only, without Markdown fences, with exactly these keys:
{
  "summary": "short overall summary",
  "confirmed_requirements": ["facts explicitly stated by the client"],
  "missing_information": ["important details that need clarification"],
  "risks": ["possible scope, deadline, revision, or expectation risks"],
  "suggested_questions": ["clear questions the freelancer can ask the client"],
  "checklist": ["items to confirm before work starts"],
  "risk_level": "Low, Medium, or High"
}
If a category has no items, return an empty array. Never claim that the message is a legal contract.
"""


def find_llama_server() -> str | None:
    """Find llama-server in the project tools folder or PATH."""
    candidates = [
        BASE_DIR / "tools" / "llama-server.exe",
        BASE_DIR / "tools" / "llama-server",
    ]
    env_exe = os.getenv("SCOPESAATHI_LLAMA_SERVER")
    if env_exe:
        candidates.insert(0, Path(env_exe).expanduser())
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)
    return shutil.which("llama-server.exe") or shutil.which("llama-server")


def server_is_ready() -> bool:
    try:
        response = requests.get(f"{LLAMA_BASE_URL}/health", timeout=1.2)
        return response.status_code == 200
    except requests.RequestException:
        return False


def start_local_model_if_possible() -> None:
    """Start llama-server only when the model file and executable are available."""
    global MODEL_PROCESS
    if server_is_ready() or not MODEL_PATH.is_file():
        return
    executable = find_llama_server()
    if not executable:
        return
    with MODEL_START_LOCK:
        if server_is_ready():
            return
        if MODEL_PROCESS is not None and MODEL_PROCESS.poll() is None:
            return
        try:
            log_path = BASE_DIR / "model_server.log"
            log_file = open(log_path, "a", encoding="utf-8")
            command = [
                executable,
                "-m", str(MODEL_PATH),
                "--host", "127.0.0.1",
                "--port", "8080",
                "--alias", MODEL_ALIAS,
                "--ctx-size", "4096",
            ]
            creation_flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
            MODEL_PROCESS = subprocess.Popen(
                command,
                cwd=str(BASE_DIR),
                stdout=log_file,
                stderr=subprocess.STDOUT,
                creationflags=creation_flags,
            )
        except (OSError, ValueError):
            MODEL_PROCESS = None


def parse_json_response(text: str) -> dict[str, Any]:
    """Parse JSON model output, allowing common Markdown fences as a fallback."""
    text = (text or "").strip()
    candidates = [text]
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            candidates.insert(0, "\n".join(lines[1:-1]).strip())
    left, right = text.find("{"), text.rfind("}")
    if left >= 0 and right > left:
        candidates.append(text[left:right + 1])
    for candidate in candidates:
        try:
            result = json.loads(candidate)
            if isinstance(result, dict):
                return result
        except json.JSONDecodeError:
            continue
    return {"summary": text or "The model returned an empty response."}


def normalise_analysis(raw: dict[str, Any]) -> dict[str, Any]:
    def as_list(key: str) -> list[str]:
        value = raw.get(key, [])
        if isinstance(value, str):
            value = [value]
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    summary = raw.get("summary", "")
    if not isinstance(summary, str):
        summary = str(summary)
    risk_level = str(raw.get("risk_level", "Medium")).strip().title()
    if risk_level not in {"Low", "Medium", "High"}:
        risk_level = "Medium"
    return {
        "summary": summary.strip() or "Review the findings below before agreeing to the work.",
        "confirmed_requirements": as_list("confirmed_requirements"),
        "missing_information": as_list("missing_information"),
        "risks": as_list("risks"),
        "suggested_questions": as_list("suggested_questions"),
        "checklist": as_list("checklist"),
        "risk_level": risk_level,
    }


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/status")
def api_status():
    """Return safe provider status without exposing any secret configuration."""
    if AI_PROVIDER == "openrouter":
        configured = bool(OPENROUTER_API_KEY)
        return jsonify({
            "app": "ScopeSaathi AI",
            "ai_provider": "openrouter",
            "provider_label": "OpenRouter (online)",
            "ai_connected": configured,
            "local_ai_connected": False,
            "cloud_ai_configured": configured,
            "model_name": OPENROUTER_MODEL,
            "mode": "OpenRouter configured" if configured else "OpenRouter API key missing",
            "privacy": "Analysis requests are sent over the internet to OpenRouter and the selected model provider. Avoid confidential client data unless you have permission.",
        })

    connected = server_is_ready()
    llama_found = bool(find_llama_server())
    return jsonify({
        "app": "ScopeSaathi AI",
        "ai_provider": "local",
        "provider_label": "Local AI (offline capable)",
        "ai_connected": connected,
        "local_ai_connected": connected,
        "cloud_ai_configured": False,
        "model_file_found": MODEL_PATH.is_file(),
        "llama_server_found": llama_found,
        "model_name": MODEL_PATH.name if MODEL_PATH.is_file() else "Qwen3.5 0.8B Q4_0 (not installed)",
        "mode": "Local AI connected" if connected else "Local AI not connected",
        "privacy": "In local mode, AI requests are sent only to 127.0.0.1:8080.",
    })


@app.post("/api/analyze")
def api_analyze():
    data = request.get_json(silent=True) or {}
    brief = str(data.get("brief", "")).strip()
    role = str(data.get("role", "Freelancer")).strip()[:100] or "Freelancer"
    language = str(data.get("language", "Simple English")).strip()[:80] or "Simple English"
    project_type = str(data.get("project_type", "General project")).strip()[:100] or "General project"

    if len(brief) < 15:
        return jsonify({"error": "Please enter a little more detail (at least 15 characters)."}), 400
    user_prompt = (
        f"Freelancer role: {role}\nProject type: {project_type}\n"
        f"Output language: {language}\n\nClient message to analyse:\n{brief}"
    )
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    try:
        if AI_PROVIDER == "openrouter":
            if not OPENROUTER_API_KEY:
                return jsonify({"error": "OpenRouter is not configured yet. Add OPENROUTER_API_KEY in Render Environment settings, then redeploy."}), 503
            payload = {
                "model": OPENROUTER_MODEL,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 1400,
            }
            response = requests.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "X-OpenRouter-Title": "ScopeSaathi AI",
                },
                json=payload,
                timeout=(10, 120),
            )
            if not response.ok:
                if response.status_code == 429:
                    return jsonify({"error": "OpenRouter rate limit reached. Wait a little and try again, or choose another available model."}), 429
                app.logger.warning("OpenRouter returned HTTP %s", response.status_code)
                return jsonify({"error": f"OpenRouter request failed (HTTP {response.status_code}). Check the API key, model availability, and Render logs."}), 502
        else:
            if not server_is_ready():
                start_local_model_if_possible()
                # Give an already configured local model a short chance to finish starting.
                for _ in range(25):
                    time.sleep(0.8)
                    if server_is_ready():
                        break
            if not server_is_ready():
                return jsonify({"error": "Local AI is not connected. Install llama.cpp, place the Qwen GGUF file in the models folder, then restart ScopeSaathi. No cloud API is used in local mode."}), 503
            payload = {
                "model": MODEL_ALIAS,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 1400,
                "response_format": {"type": "json_object"},
            }
            response = requests.post(CHAT_URL, json=payload, timeout=(5, 180))
            if not response.ok:
                app.logger.warning("Local inference returned HTTP %s", response.status_code)
                return jsonify({"error": "The local AI server returned an error. Check your model/server setup and try again."}), 502

        body = response.json()
        content = body["choices"][0]["message"]["content"]
        if isinstance(content, list):
            content = "\n".join(str(part.get("text", "")) if isinstance(part, dict) else str(part) for part in content)
        analysis = normalise_analysis(parse_json_response(str(content)))
        return jsonify({"success": True, "analysis": analysis})
    except requests.Timeout:
        message = "OpenRouter took too long to respond. Please try again." if AI_PROVIDER == "openrouter" else "The local AI took too long to respond. Try a shorter message or restart the model server."
        return jsonify({"error": message}), 504
    except (requests.RequestException, KeyError, IndexError, TypeError, ValueError) as exc:
        app.logger.warning("AI inference failed (%s mode): %s", AI_PROVIDER, type(exc).__name__)
        return jsonify({"error": "Could not read a valid AI reply. Please try again; if it keeps failing, check Render logs or the local model-server log."}), 502


if __name__ == "__main__":
    start_local_model_if_possible()
    threading.Timer(1.2, lambda: webbrowser.open("http://127.0.0.1:5000")).start()
    app.run(host="127.0.0.1", port=5000, debug=False, threaded=True)
