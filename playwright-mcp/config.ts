/**
 * playwright-mcp 共通設定
 *
 * @playwright/mcp を MCP サーバーとして起動し、
 * @modelcontextprotocol/sdk のインメモリクライアントから操作する。
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createConnection } = require("@playwright/mcp");
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

export async function createMcpClient(headless = false): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = await createConnection({ browser: { headless, isolated: true } });
  await server.connect(serverTransport);

  const client = new Client({ name: "focus-flow-test", version: "1.0.0" });
  await client.connect(clientTransport);
  return client;
}

export async function navigate(client: Client, url: string): Promise<void> {
  await client.callTool({ name: "browser_navigate", arguments: { url } });
}

export async function click(client: Client, selector: string, description: string): Promise<void> {
  await client.callTool({
    name: "browser_click",
    arguments: { element: description, target: selector },
  });
}

export async function typeText(
  client: Client,
  selector: string,
  text: string,
  description: string,
): Promise<void> {
  await client.callTool({
    name: "browser_type",
    arguments: { element: description, target: selector, text },
  });
}

export async function clearAndType(
  client: Client,
  selector: string,
  text: string,
  description: string,
): Promise<void> {
  if (text) {
    // テキストがある場合は browser_fill_form で一括入力（React onChange を正しく発火）
    await client.callTool({
      name: "browser_fill_form",
      arguments: {
        fields: [{ element: description, target: selector, name: description, type: "textbox", value: text }],
      },
    });
  } else {
    // 空文字にする場合: スペースで fill してから Backspace で削除（React 対応）
    await client.callTool({
      name: "browser_type",
      arguments: { element: description, target: selector, text: " " },
    });
    await client.callTool({
      name: "browser_press_key",
      arguments: { key: "Backspace" },
    });
  }
}

export async function snapshot(client: Client): Promise<string> {
  const result = await client.callTool({ name: "browser_snapshot", arguments: {} });
  const content = result.content as Array<{ type: string; text: string }>;
  return content.map((c) => c.text).join("\n");
}

export function parseEvalResult(content: Array<{ type: string; text: string }>): string {
  const raw = content.map((c) => c.text).join("");
  // Response format: "### Result\n\"value\"\n### Ran Playwright code\n..."
  const match = raw.match(/###\s*Result\s*\n([\s\S]*?)(?:\n###|$)/);
  if (match) {
    return match[1].trim().replace(/^"|"$/g, "");
  }
  return raw.trim().replace(/^"|"$/g, "");
}

export async function getTextContent(client: Client, selector: string): Promise<string> {
  const result = await client.callTool({
    name: "browser_evaluate",
    arguments: {
      function: `() => document.querySelector(${JSON.stringify(selector)})?.textContent?.trim() ?? ""`,
    },
  });
  return parseEvalResult(result.content as Array<{ type: string; text: string }>);
}

export async function isVisible(client: Client, selector: string): Promise<boolean> {
  const result = await client.callTool({
    name: "browser_evaluate",
    arguments: {
      function: `() => !!document.querySelector(${JSON.stringify(selector)})`,
    },
  });
  const val = parseEvalResult(result.content as Array<{ type: string; text: string }>);
  return val === "true";
}

export async function getAttribute(
  client: Client,
  selector: string,
  attr: string,
): Promise<string> {
  const result = await client.callTool({
    name: "browser_evaluate",
    arguments: {
      function: `() => document.querySelector(${JSON.stringify(selector)})?.getAttribute(${JSON.stringify(attr)}) ?? ""`,
    },
  });
  return parseEvalResult(result.content as Array<{ type: string; text: string }>);
}

export async function getValue(client: Client, selector: string): Promise<string> {
  const result = await client.callTool({
    name: "browser_evaluate",
    arguments: {
      function: `() => { const el = document.querySelector(${JSON.stringify(selector)}); return el && "value" in el ? el.value : ""; }`,
    },
  });
  return parseEvalResult(result.content as Array<{ type: string; text: string }>);
}

export async function waitFor(client: Client, selector: string): Promise<void> {
  await client.callTool({
    name: "browser_wait_for",
    arguments: { selector },
  });
}

export function log(step: string, message: string): void {
  console.log(`\n📌 [${step}] ${message}`);
}

export function ok(message: string): void {
  console.log(`  ✅ ${message}`);
}

export function fail(message: string): never {
  throw new Error(`❌ ${message}`);
}
