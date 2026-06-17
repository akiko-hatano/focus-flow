/**
 * focus-flow の Settings テスト
 *
 * テスト内容:
 *   1. テーマを切り替えると「選択中:」ラベルが変わる
 *
 * 実行方法:
 *   pnpm stagehand:settings
 */

import { Stagehand, AISdkClient } from "@browserbasehq/stagehand";
import { z } from "zod";
import { bedrock, modelId, log, ok, fail } from "./config";

const APP_URL = "http://localhost:3000/settings";

async function main() {
  console.log(`\n🤖 モデル: ${modelId}`);
  console.log(`🌐 テスト対象: ${APP_URL}\n`);

  const stagehand = new Stagehand({
    env: "LOCAL",
    llmClient: new AISdkClient({ model: bedrock(modelId) }),
    localBrowserLaunchOptions: { headless: false },
    verbose: 1,
    disablePino: true,
    actTimeoutMs: 30000,
  });

  await stagehand.init();
  const page = stagehand.context.activePage();
  if (!page) throw new Error("ブラウザページを取得できませんでした");

  try {
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });

    // ─────────────────────────────────────────
    // 現在のテーマを取得する
    // ─────────────────────────────────────────
    log("READ", "現在のテーマを確認する");
    const { currentTheme } = await stagehand.extract(
      `「選択中:」と書かれたテキストの後に続くテーマ名を取得して`,
      z.object({ currentTheme: z.string().describe("現在選択されているテーマ名") }),
    );
    ok(`現在のテーマ: "${currentTheme}"`);

    // ─────────────────────────────────────────
    // テーマを切り替える
    // ─────────────────────────────────────────
    log("UPDATE", "別のテーマに切り替える");

    const themes = await stagehand.observe("テーマカラーの選択ボタン（色のついた丸いボタン）を検出して");
    if (themes.length < 2) fail("テーマボタンが2つ以上見つかりません");

    // 現在と異なるテーマを選ぶ
    await stagehand.act(`"${currentTheme}" 以外のテーマカラーボタンをひとつクリックして`);

    const { newTheme } = await stagehand.extract(
      `「選択中:」と書かれたテキストの後に続くテーマ名を取得して`,
      z.object({ newTheme: z.string().describe("変更後のテーマ名") }),
    );
    if (newTheme === currentTheme) fail(`テーマが変わっていません: "${newTheme}"`);
    ok(`テーマ変更成功: "${currentTheme}" → "${newTheme}"`);

    console.log("\n🎉 Settings テスト完了！\n");
  } finally {
    await stagehand.close();
  }
}

main().catch((err) => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
