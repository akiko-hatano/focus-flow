/**
 * focus-flow の Settings テスト (playwright-mcp)
 *
 * 実行方法:
 *   pnpm playwright-mcp:settings
 *
 * 事前準備:
 *   pnpm dev でアプリを起動しておく
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { click, createMcpClient, fail, log, navigate, ok, parseEvalResult, waitFor } from "./config";

const APP_URL = "http://localhost:3000/settings";

// 「選択中: Indigo」のような表示テキストからテーマ名だけを取り出す
async function getSelectedThemeLabel(client: Client): Promise<string> {
  const result = await client.callTool({
    name: "browser_evaluate",
    arguments: {
      function: `() => document.querySelector('[data-testid="selected-theme-label"]')?.textContent?.replace('選択中: ', '').trim() ?? ''`,
    },
  });
  return parseEvalResult(result.content as Array<{ type: string; text: string }>);
}

// 現在選択中以外のテーマスウォッチを DOM から探して id を返す
async function getFirstOtherThemeId(client: Client, currentThemeLabel: string): Promise<string> {
  const result = await client.callTool({
    name: "browser_evaluate",
    arguments: {
      function: `() => {
        const swatches = document.querySelectorAll('[data-testid^="theme-swatch-"]');
        for (const swatch of swatches) {
          const label = swatch.getAttribute('aria-label') ?? '';
          if (!label.includes(${JSON.stringify(currentThemeLabel)})) {
            const testId = swatch.getAttribute('data-testid') ?? '';
            return testId.replace('theme-swatch-', '');
          }
        }
        return '';
      }`,
    },
  });
  return parseEvalResult(result.content as Array<{ type: string; text: string }>);
}

async function main(): Promise<void> {
  console.log(`\n🌐 テスト対象: ${APP_URL}\n`);

  const client = await createMcpClient(false);

  try {
    await navigate(client, APP_URL);
    await waitFor(client, '[data-testid="theme-selector"]');

    // ─────────────────────────────────────────
    // 現在のテーマを取得する
    // 「選択中:」ラベルのテキストを読み取り、切り替え先の比較基準にする
    // ─────────────────────────────────────────
    log("READ", "現在のテーマを確認する");
    const currentTheme = await getSelectedThemeLabel(client);
    if (!currentTheme) fail("現在のテーマを取得できませんでした");
    ok(`現在のテーマ: "${currentTheme}"`);

    // ─────────────────────────────────────────
    // テーマを切り替える
    // 現在と異なるスウォッチを選んでクリックし、「選択中:」ラベルが変わることを確認
    // ─────────────────────────────────────────
    log("UPDATE", "別のテーマに切り替える");
    const otherThemeId = await getFirstOtherThemeId(client, currentTheme);
    if (!otherThemeId) fail("切り替え先のテーマが見つかりません");

    await click(
      client,
      `[data-testid="theme-swatch-${otherThemeId}"]`,
      `"${otherThemeId}" テーマスウォッチ`,
    );

    const newTheme = await getSelectedThemeLabel(client);
    if (newTheme === currentTheme) fail(`テーマが変わっていません: "${newTheme}"`);
    ok(`テーマ変更成功: "${currentTheme}" → "${newTheme}"`);

    console.log("\n🎉 Settings テスト完了！\n");
  } finally {
    await client.callTool({ name: "browser_close", arguments: {} });
    await client.close();
  }
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(`\n${error.message}`);
  }
  process.exit(1);
});
