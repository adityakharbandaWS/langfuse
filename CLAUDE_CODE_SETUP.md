# Local Langfuse with Claude Code cost

This branch is Langfuse plus a small patch. The patch reads Claude Code's OpenTelemetry token counts, so Claude Code traces show usage, cost and time to first token. A daily bot keeps the branch on the latest Langfuse release.

## Start it

Requires Docker, nothing else.

```bash
git clone https://github.com/adityakharbandaWS/langfuse.git langfuse-claude-code
cd langfuse-claude-code
git checkout feat/otel-claude-code-usage
scripts/claude-code/up.sh
```

The first start builds the worker and takes about 10 minutes. Then open http://localhost:3000.

## Send Claude Code traces to it

1. In Langfuse, create a project and an API key. Then build the auth value:
   `echo -n "pk-lf-...:sk-lf-..." | base64`
2. Add this to the `env` block of `~/.claude/settings.json`, then restart Claude Code:

   ```json
   "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
   "CLAUDE_CODE_ENHANCED_TELEMETRY_BETA": "1",
   "OTEL_TRACES_EXPORTER": "otlp",
   "OTEL_EXPORTER_OTLP_TRACES_PROTOCOL": "http/protobuf",
   "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT": "http://localhost:3000/api/public/otel/v1/traces",
   "OTEL_EXPORTER_OTLP_HEADERS": "Authorization=Basic <base64 value from step 1>"
   ```

   Optional: `OTEL_LOG_USER_PROMPTS`, `OTEL_LOG_TOOL_DETAILS` and `OTEL_LOG_TOOL_CONTENT` set to `"1"` also record prompt and tool contents in your local Langfuse.

Only traces that arrive after the patched worker is running get a cost.

## Update to a newer release

```bash
git fetch origin
git reset --hard origin/feat/otel-claude-code-usage
scripts/claude-code/up.sh
```

The bot rewrites this branch when it moves to a new release, so update with `reset` rather than `git pull`. Don't keep your own commits on this branch.

## Notes

- **No usage statistics leave your machine.** Langfuse normally reports anonymous usage statistics to Langfuse's PostHog analytics. This setup turns that off: `TELEMETRY_ENABLED=false` is the default in `docker-compose.claude-code.yml`, so there's nothing to configure. To opt in, put `TELEMETRY_ENABLED=true` in a `.env` file in this folder. Your traces only go to your local Langfuse either way.
- **Always start it with the script.** It keeps web and worker on the same release. A plain `docker compose up` falls back to the stock worker, which shows no cost.
- **Existing setup:** if you already run Langfuse with this repo's `docker-compose.yml`, the script reuses the same containers and data, because the Compose project is named `langfuse`.
- **Stop:** `docker compose -p langfuse down`. Your data is kept.
