# ScopeSaathi AI — Render + OpenRouter deploy version

This version keeps the same multi-page ScopeSaathi interface and uses OpenRouter for AI analysis when deployed on Render. It does **not** run Qwen locally on Render. Hosted analysis needs internet and sends the submitted brief to OpenRouter and the selected model provider. Do not submit confidential client details without permission.

## Deploy steps

1. Create an OpenRouter account at https://openrouter.ai/ and create an API key: https://openrouter.ai/keys . The default model route is `openrouter/free`; availability and rate limits can change.
2. Create a GitHub repository and upload the contents of this project folder. Do not upload your API key. Keep `.env` files and keys out of GitHub.
3. In Render, choose **New + → Blueprint** and connect the GitHub repository containing `render.yaml`, or create a **New Web Service** from that repository.
4. For a manual web service use: Build command `pip install -r requirements.txt`; Start command `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120`.
5. Add environment variables in Render → service → Environment: `AI_PROVIDER=openrouter`, `OPENROUTER_MODEL=openrouter/free`, and `OPENROUTER_API_KEY` with the key from OpenRouter. Never put the key in HTML, JavaScript, GitHub, or a screenshot. If using the Blueprint, it prompts for the secret because `sync: false` is set.
6. Deploy. Open the `onrender.com` URL, go to Settings, and check that the OpenRouter key is configured. Run an example analysis to test the real request.

## Important limits

- Render’s free service can sleep after inactivity and the first request may be slow. The OpenRouter free router is subject to model availability and rate limits.
- The API key being present only confirms configuration; the first analysis tests whether OpenRouter accepts the key and can route the request.
- The hosted Render version cannot perform AI analysis without internet. For offline use, run the local version of ScopeSaathi with llama.cpp and the Qwen GGUF model on your laptop.
- History is saved in the current browser's localStorage; it is not shared across users or synced to a cloud database.
- The output is an aid to project planning, not legal advice. Review suggestions before using them with a client.

## Local offline version

Set `AI_PROVIDER=local` (or omit it) and set up llama.cpp plus the Qwen GGUF file as described in the local version's README. Do not set an OpenRouter key if you intend to keep briefs local.
