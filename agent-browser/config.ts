/**
 * agent-browser 共通設定
 *
 * agent-browser（Rust製ネイティブCLI）をサブプロセスとして呼び出し、
 * --json 出力を解析してブラウザを操作する。LLM は使わない。
 */

import { execFileSync } from "node:child_process";

const SESSION = "focus-flow-agent-browser-test";

interface CliResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

function execCli<T>(args: string[]): T {
  const output = execFileSync("agent-browser", args, { encoding: "utf-8" });
  const response = JSON.parse(output) as CliResponse<T>;
  if (!response.success || response.data === null) {
    throw new Error(response.error ?? "agent-browser コマンドが失敗しました");
  }
  return response.data;
}

function cmd<T>(args: string[]): T {
  return execCli<T>(["--session", SESSION, ...args, "--json"]);
}

export function openBrowser(url: string, headed = true): void {
  const args = ["open", url];
  if (headed) args.unshift("--headed");
  execCli<{ url: string }>(["--session", SESSION, ...args, "--json"]);
}

export function closeBrowser(): void {
  cmd<{ closed: boolean }>(["close"]);
}

export function navigate(url: string): void {
  cmd<{ url: string }>(["open", url]);
}

export function click(selector: string): void {
  cmd<{ clicked: string }>(["click", selector]);
}

export function typeText(selector: string, text: string): void {
  cmd<{ typed: string }>(["type", selector, text]);
}

export function clearAndType(selector: string, text: string): void {
  // fill は DOM に直接値をセットするだけで React の onChange が発火しないため、
  // カーソルを末尾に移動して Backspace で全消去してから実キーストロークで入力する
  click(selector);
  cmd<{ pressed: string }>(["press", "End"]);
  const current = getValue(selector);
  for (let i = 0; i < current.length; i++) {
    cmd<{ pressed: string }>(["press", "Backspace"]);
  }
  if (text) cmd<{ typed: string }>(["keyboard", "type", text]);
}

export function getValue(selector: string): string {
  return cmd<{ value: string }>(["get", "value", selector]).value;
}

export function getAttribute(selector: string, attr: string): string {
  return cmd<{ value: string }>(["get", "attr", selector, attr]).value;
}

export function isVisible(selector: string): boolean {
  try {
    return cmd<{ visible: boolean }>(["is", "visible", selector]).visible;
  } catch {
    // 要素が DOM に存在しない場合もエラーになるため、非表示扱いにする
    return false;
  }
}

export function waitFor(selector: string): void {
  cmd<{ waited: string }>(["wait", selector]);
}

export function evalJs<T = unknown>(script: string): T {
  return cmd<{ result: T }>(["eval", script]).result;
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
