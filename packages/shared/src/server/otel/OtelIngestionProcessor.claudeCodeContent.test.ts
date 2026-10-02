import { describe, expect, it } from "vitest";

import {
  OtelIngestionProcessor,
  type ResourceSpan,
} from "./OtelIngestionProcessor";

const stringAttributes = (attributes: Record<string, string>) =>
  Object.entries(attributes).map(([key, value]) => ({
    key,
    value: { stringValue: value },
  }));

const processClaudeCodeSpan = (span: {
  name: string;
  attributes: Record<string, string>;
  events?: { name: string; attributes: Record<string, string> }[];
}) => {
  const batch: ResourceSpan[] = [
    {
      scopeSpans: [
        {
          scope: {
            name: "com.anthropic.claude_code.tracing",
            version: "1.0.0",
          },
          spans: [
            {
              traceId: Buffer.from("0123456789abcdef0123456789abcdef", "hex"),
              spanId: Buffer.from("0123456789abcdef", "hex"),
              name: span.name,
              kind: 1,
              startTimeUnixNano: "1752384000000000000",
              endTimeUnixNano: "1752384001000000000",
              attributes: stringAttributes(span.attributes),
              events: (span.events ?? []).map((event) => ({
                timeUnixNano: "1752384000500000000",
                name: event.name,
                attributes: stringAttributes(event.attributes),
              })),
              status: {},
            },
          ],
        },
      ],
    },
  ];

  const events = new OtelIngestionProcessor({
    projectId: "project-1",
    publicKey: "pk-test",
    sdkName: "claude-code",
    sdkVersion: "2.1.287",
  }).processToEvent(batch);

  expect(events).toHaveLength(1);
  return events[0];
};

describe("OtelIngestionProcessor Claude Code content", () => {
  it("uses the interaction's user prompt as input", () => {
    const event = processClaudeCodeSpan({
      name: "claude_code.interaction",
      attributes: {
        "span.type": "interaction",
        user_prompt: "42",
        user_prompt_length: "2",
      },
    });

    expect(event.input).toBe("42");
    expect(event.output).toBeNull();
    expect(event.metadata).not.toHaveProperty("attributes.user_prompt");
    expect(event.metadata).toHaveProperty("attributes.user_prompt_length");
  });

  it("uses the tool's command as input and its tool.output event as output", () => {
    const event = processClaudeCodeSpan({
      name: "claude_code.tool",
      attributes: {
        "span.type": "tool",
        tool_name: "Bash",
        full_command: "ls -la",
      },
      events: [
        {
          name: "tool.output",
          attributes: { bash_command: "ls -la", output: "total 0" },
        },
      ],
    });

    expect(event.input).toBe("ls -la");
    expect(event.output).toBe("total 0");
  });

  it("leaves input empty when the content gate is off", () => {
    const event = processClaudeCodeSpan({
      name: "claude_code.interaction",
      attributes: { "span.type": "interaction", user_prompt: "<REDACTED>" },
    });

    expect(event.input ?? null).toBeNull();
  });
});
