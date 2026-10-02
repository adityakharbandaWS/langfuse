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

1. **Get an API key and turn it into an auth value.**
   1. Open http://localhost:3000 and sign up. The account only exists in your local Langfuse. Create an organization and a project.
   2. In the project, go to **Settings → API Keys → Create new API keys**. You get two keys: a **public key** (starts with `pk-lf-`) and a **secret key** (starts with `sk-lf-`). Copy both now, because the secret key is only shown once.
   3. Open a terminal and run the line below, replacing the two placeholders with your keys. Keep the quotes, and put a colon between the keys with no spaces:

      ```bash
      echo -n "pk-lf-YOUR-PUBLIC-KEY:sk-lf-YOUR-SECRET-KEY" | base64 | tr -d '\n'; echo
      ```

   4. It prints one long line of letters and numbers, often ending in `=`. That's your auth value; copy all of it. For example, the made-up keys `pk-lf-1234abcd` and `sk-lf-5678efgh` give `cGstbGYtMTIzNGFiY2Q6c2stbGYtNTY3OGVmZ2g=`. Yours will be longer.

   This encodes both keys into one value (base64) that Langfuse accepts as a login for incoming traces. It isn't encryption, so treat the result as secret, just like the secret key.
2. Add this to the `env` block of `~/.claude/settings.json`, then restart Claude Code:

   ```json
   "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
   "CLAUDE_CODE_ENHANCED_TELEMETRY_BETA": "1",
   "OTEL_TRACES_EXPORTER": "otlp",
   "OTEL_EXPORTER_OTLP_TRACES_PROTOCOL": "http/protobuf",
   "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT": "http://localhost:3000/api/public/otel/v1/traces",
   "OTEL_EXPORTER_OTLP_HEADERS": "Authorization=Basic YOUR-AUTH-VALUE",
   "OTEL_LOG_USER_PROMPTS": "1",
   "OTEL_LOG_TOOL_DETAILS": "1",
   "OTEL_LOG_TOOL_CONTENT": "1"
   ```

   Replace `YOUR-AUTH-VALUE` with the auth value from step 1, and keep the space after `Basic`.

   The last three record your prompts and tool inputs and outputs, so traces show what happened, not just timings and cost. They're only sent to your local Langfuse.

This is a user-level setting, so it covers Claude Code everywhere on your machine: `claude` in any terminal or folder, the Claude desktop app's Code tab, IDE extensions and editors such as Zed. Regular chats in the Claude app aren't Claude Code, so they aren't traced. Langfuse has to be running when you use Claude Code. The containers restart on their own whenever Docker is running.

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
