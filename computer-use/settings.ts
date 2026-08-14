/**
 * focus-flow の Settings テスト (computer-use)
 *
 * 実行方法:
 *   pnpm computer-use:settings
 *
 * 事前準備:
 *   pnpm dev でアプリを起動しておく
 */

import type { Page } from "playwright";
import { createBrowser, fail, log, ok, runAgentTask } from "./config";

const APP_URL = "http://localhost:3000/settings";

// 「選択中: Indigo」のような表示テキストからテーマ名だけを取り出す（素の Playwright 操作）
async function getSelectedThemeLabel(page: Page): Promise<string> {
  const text = await page.locator('[data-testid="selected-theme-label"]').textContent();
  return text?.replace("選択中: ", "").trim() ?? "";
}

// 現在選択中以外のテーマスウォッチを DOM から探して id とラベルを返す
async function getFirstOtherTheme(
  page: Page,
  currentThemeLabel: string,
): Promise<{ id: string; label: string }> {
  return page.evaluate((current) => {
    const swatches = document.querySelectorAll('[data-testid^="theme-swatch-"]');
    for (const swatch of swatches) {
      const label = swatch.getAttribute("aria-label") ?? "";
      if (!label.includes(current)) {
        const testId = swatch.getAttribute("data-testid") ?? "";
        return { id: testId.replace("theme-swatch-", ""), label };
      }
    }
    return { id: "", label: "" };
  }, currentThemeLabel);
}

async function main(): Promise<void> {
  console.log(`\n🌐 テスト対象: ${APP_URL}\n`);

  const { browser, page } = await createBrowser(false);

  try {
    await page.goto(APP_URL);
    await page.waitForSelector('[data-testid="theme-selector"]');

    // ─────────────────────────────────────────
    // 現在のテーマを取得する
    // ─────────────────────────────────────────
    log("READ", "現在のテーマを確認する");
    const currentTheme = await getSelectedThemeLabel(page);
    if (!currentTheme) fail("現在のテーマを取得できませんでした");
    ok(`現在のテーマ: "${currentTheme}"`);

    // ─────────────────────────────────────────
    // テーマを切り替える
    // ─────────────────────────────────────────
    log("UPDATE", "別のテーマに切り替える");
    const other = await getFirstOtherTheme(page, currentTheme);
    if (!other.id) fail("切り替え先のテーマが見つかりません");

    await runAgentTask(
      page,
      `テーマ選択画面には複数の色のスウォッチが並んでいます。現在「${currentTheme}」が選択中（枠線やチェックマークなどで強調表示）です。それ以外のスウォッチを1つクリックしてテーマを切り替えてください。完了したら "done" と一言だけ返してください。`,
    );

    const newTheme = await getSelectedThemeLabel(page);
    if (newTheme === currentTheme) fail(`テーマが変わっていません: "${newTheme}"`);
    ok(`テーマ変更成功: "${currentTheme}" → "${newTheme}"`);

    console.log("\n🎉 Settings テスト完了！\n");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(`\n${error.message}`);
  }
  process.exit(1);
});
