/**
 * focus-flow の Profile テスト
 *
 * テスト内容:
 *   1. 名前・メールを更新して保存 → "Updated!" が表示される
 *   2. 不正な値でバリデーションエラーが出る
 *   3. Cancel で変更がリセットされる
 *
 * 実行方法:
 *   pnpm stagehand:profile
 */

import { Stagehand, AISdkClient } from "@browserbasehq/stagehand";
import { z } from "zod";
import { bedrock, modelId, log, ok, fail } from "./config";

const APP_URL = "http://localhost:3000/profile";

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
    // 1. プロフィールを更新して保存する
    // ─────────────────────────────────────────
    log("UPDATE", "名前とメールアドレスを更新して保存する");

    await stagehand.act(`"Full Name" というラベルの入力欄のテキストをすべて消して "Test User" と入力して`);
    await stagehand.act(`"Email Address" というラベルの入力欄のテキストをすべて消して "test@example.com" と入力して`);
    await stagehand.act(`"Save Changes" ボタンをクリックして`);

    const { saveStatus } = await stagehand.extract(
      `"Save Changes" ボタンが "Updated!" という表示になっているか確認して`,
      z.object({ saveStatus: z.string().describe('"Updated!" または "Save Changes"') }),
    );
    if (!saveStatus.includes("Updated")) fail(`保存が確認できません: "${saveStatus}"`);
    ok(`保存成功: "${saveStatus}"`);

    // ─────────────────────────────────────────
    // 2. バリデーション: 名前が空
    // ─────────────────────────────────────────
    log("VALIDATION (name)", "名前を空にすると「名前を入力してください」が出ることを確認する");

    await stagehand.act(`"Full Name" の入力欄のテキストをすべて消して`);
    await stagehand.act(`"Save Changes" ボタンをクリックして`);

    const { nameError } = await stagehand.extract(
      `"名前を入力してください" というエラーメッセージが表示されているか確認して`,
      z.object({ nameError: z.boolean().describe("エラーメッセージが表示されているか") }),
    );
    if (!nameError) fail('"名前を入力してください" が表示されていません');
    ok(`バリデーションエラー確認: "名前を入力してください"`);

    // ─────────────────────────────────────────
    // 3. バリデーション: メールアドレスが不正
    // ─────────────────────────────────────────
    log("VALIDATION (email)", "不正なメールアドレスで「有効なメールアドレスを入力してください」が出ることを確認する");

    await stagehand.act(`"Full Name" の入力欄に "Test User" と入力して`);
    await stagehand.act(`"Email Address" の入力欄のテキストをすべて消して "not-an-email" と入力して`);
    await stagehand.act(`"Save Changes" ボタンをクリックして`);

    const { emailError } = await stagehand.extract(
      `"有効なメールアドレスを入力してください" というエラーメッセージが表示されているか確認して`,
      z.object({ emailError: z.boolean().describe("エラーメッセージが表示されているか") }),
    );
    if (!emailError) fail('"有効なメールアドレスを入力してください" が表示されていません');
    ok(`バリデーションエラー確認: "有効なメールアドレスを入力してください"`);

    // ─────────────────────────────────────────
    // 4. Cancel で変更をリセットする
    // ─────────────────────────────────────────
    log("CANCEL", "Cancel ボタンで変更をリセットする");

    await stagehand.act(`"Full Name" の入力欄のテキストをすべて消して "Changed Name" と入力して`);
    await stagehand.act(`"Cancel" ボタンをクリックして`);

    const { nameValue } = await stagehand.extract(
      `"Full Name" の入力欄の現在の値を取得して`,
      z.object({ nameValue: z.string().describe("入力欄の現在の値") }),
    );
    if (nameValue === "Changed Name") fail(`Cancel が効いていません: "${nameValue}"`);
    ok(`Cancel でリセット成功: "${nameValue}"`);

    console.log("\n🎉 Profile テスト完了！\n");
  } finally {
    await stagehand.close();
  }
}

main().catch((err) => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
