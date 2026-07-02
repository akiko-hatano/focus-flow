/**
 * focus-flow の Settings テスト (agent-browser)
 *
 * 実行方法:
 *   pnpm agent-browser:settings
 *
 * 事前準備:
 *   pnpm dev でアプリを起動しておく
 */

import { click, closeBrowser, evalJs, fail, log, navigate, ok, openBrowser, waitFor } from "./config";

const APP_URL = "http://localhost:3000/settings";

// 「選択中: Indigo」のような表示テキストからテーマ名だけを取り出す
function getSelectedThemeLabel(): string {
  return evalJs<string>(
    `document.querySelector('[data-testid="selected-theme-label"]')?.textContent?.replace('選択中: ', '').trim() ?? ''`,
  );
}

// 現在選択中以外のテーマスウォッチを DOM から探して id を返す
function getFirstOtherThemeId(currentThemeLabel: string): string {
  return evalJs<string>(`(() => {
    const swatches = document.querySelectorAll('[data-testid^="theme-swatch-"]');
    for (const swatch of swatches) {
      const label = swatch.getAttribute('aria-label') ?? '';
      if (!label.includes(${JSON.stringify(currentThemeLabel)})) {
        const testId = swatch.getAttribute('data-testid') ?? '';
        return testId.replace('theme-swatch-', '');
      }
    }
    return '';
  })()`);
}

async function main(): Promise<void> {
  console.log(`\n🌐 テスト対象: ${APP_URL}\n`);

  openBrowser(APP_URL);

  try {
    navigate(APP_URL);
    waitFor('[data-testid="theme-selector"]');

    // ─────────────────────────────────────────
    // 現在のテーマを取得する
    // 「選択中:」ラベルのテキストを読み取り、切り替え先の比較基準にする
    // ─────────────────────────────────────────
    log("READ", "現在のテーマを確認する");
    const currentTheme = getSelectedThemeLabel();
    if (!currentTheme) fail("現在のテーマを取得できませんでした");
    ok(`現在のテーマ: "${currentTheme}"`);

    // ─────────────────────────────────────────
    // テーマを切り替える
    // 現在と異なるスウォッチを選んでクリックし、「選択中:」ラベルが変わることを確認
    // ─────────────────────────────────────────
    log("UPDATE", "別のテーマに切り替える");
    const otherThemeId = getFirstOtherThemeId(currentTheme);
    if (!otherThemeId) fail("切り替え先のテーマが見つかりません");

    click(`[data-testid="theme-swatch-${otherThemeId}"]`);

    const newTheme = getSelectedThemeLabel();
    if (newTheme === currentTheme) fail(`テーマが変わっていません: "${newTheme}"`);
    ok(`テーマ変更成功: "${currentTheme}" → "${newTheme}"`);

    console.log("\n🎉 Settings テスト完了！\n");
  } finally {
    closeBrowser();
  }
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(`\n${error.message}`);
  }
  process.exit(1);
});
