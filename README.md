# Langfuse fork: Claude Code cost patch

This fork carries one small patch on top of [langfuse/langfuse](https://github.com/langfuse/langfuse). The patch maps Claude Code's OpenTelemetry token counts, `speed` and `ttft_ms`, so Claude Code traces show usage, cost and time to first token.

| Branch | What it is |
|---|---|
| `feat/otel-claude-code-usage` | The patch on top of the latest Langfuse release. A bot rebases it every day. |
| `claude-code/<tag>` | A snapshot of the patch on a specific release, e.g. `claude-code/v4.51.0`. Pin to one of these. |
| `automation` (default) | Only this README and the rebase workflow. |
| `main` | An untouched copy of upstream. Don't commit here. |

**Using it:** only the worker needs the patch. Run the stock web image at the same release, e.g. `langfuse:4.51.0`, together with a worker built from `claude-code/v4.51.0`:

```bash
docker build --platform linux/arm64 --build-arg TARGETPLATFORM=linux/arm64 \
  -f worker/Dockerfile -t langfuse-worker:4.51.0-claude-code .
```

If the repo variable `BUILD_WORKER_IMAGE` is `true`, the workflow also publishes `ghcr.io/<owner>/langfuse-worker:<version>-claude-code`.

**When the daily run fails,** the run summary lists the conflicting files. Rebase locally, then push the branch.
