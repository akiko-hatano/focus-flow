/**
 * focus-flow の Profile テスト (computer-use)
 *
 * 実行方法:
 *   pnpm computer-use:profile
 *
 * 事前準備:
 *   pnpm dev でアプリを起動しておく
 */

import { createBrowser, fail, log, ok, runAgentTask } from "./config";

const APP_URL = "http://localhost:3000/profile";

async function main(): Promise<void> {
  console.log(`\n🌐 テスト対象: ${APP_URL}\n`);

  const { browser, page } = await createBrowser(false);

  try {
    // ─────────────────────────────────────────
    // 1. プロフィールを更新して保存する
    // ─────────────────────────────────────────
    log("UPDATE", "名前とメールアドレスを更新して保存する");
    await page.goto(APP_URL);
    await page.waitForSelector('[data-testid="profile-form"]');
    await runAgentTask(
      page,
      `Full Name 入力欄に「Test User」、Email Address 入力欄に「test@example.com」と入力し、Save Changes ボタンをクリックしてください。完了したら "done" と一言だけ返してください。`,
    );
    const nameErrAfterSave = await page.locator('[data-testid="profile-name-error"]').isVisible();
    const emailErrAfterSave = await page.locator('[data-testid="profile-email-error"]').isVisible();
    if (nameErrAfterSave || emailErrAfterSave) fail("保存が確認できません");
    ok("保存成功: エラーなし");

    // ─────────────────────────────────────────
    // 2. バリデーション: 名前が空
    // ─────────────────────────────────────────
    log("VALIDATION (name)", "名前を空にすると「名前を入力してください」が出ることを確認する");
    await page.goto(APP_URL);
    await page.waitForSelector('[data-testid="profile-form"]');
    await runAgentTask(
      page,
      `Full Name 入力欄は空のままにして、Email Address 入力欄に「test@example.com」と入力し、Save Changes ボタンをクリックしてください。完了したら "done" と一言だけ返してください。`,
    );
    const nameErrorVisible = await page.locator('[data-testid="profile-name-error"]').isVisible();
    if (!nameErrorVisible) fail('"名前を入力してください" が表示されていません');
    ok('バリデーションエラー確認: "名前を入力してください"');

    // ─────────────────────────────────────────
    // 3. バリデーション: メールアドレスが不正
    // ─────────────────────────────────────────
    log(
      "VALIDATION (email)",
      "不正なメールアドレスで「有効なメールアドレスを入力してください」が出ることを確認する",
    );
    await page.goto(APP_URL);
    await page.waitForSelector('[data-testid="profile-form"]');
    await runAgentTask(
      page,
      `Full Name 入力欄に「Test User」、Email Address 入力欄に「test@test」と入力し、Save Changes ボタンをクリックしてください。完了したら "done" と一言だけ返してください。`,
    );
    const emailErrorVisible = await page.locator('[data-testid="profile-email-error"]').isVisible();
    if (!emailErrorVisible) fail('"有効なメールアドレスを入力してください" が表示されていません');
    ok('バリデーションエラー確認: "有効なメールアドレスを入力してください"');

    // ─────────────────────────────────────────
    // 4. Cancel で変更をリセットする
    // ─────────────────────────────────────────
    log("CANCEL", "Cancel ボタンで変更をリセットする");
    await page.goto(APP_URL);
    await page.waitForSelector('[data-testid="profile-form"]');
    const originalName = await page.locator('[data-testid="profile-name-input"]').inputValue();
    await runAgentTask(
      page,
      `Full Name 入力欄の内容を全て選択して削除し、「Changed Name」と入力してください。その後 Cancel ボタンをクリックしてください。完了したら "done" と一言だけ返してください。`,
    );
    const nameValue = await page.locator('[data-testid="profile-name-input"]').inputValue();
    if (nameValue !== originalName) {
      fail(`Cancel が効いていません: "${nameValue}" (期待値: "${originalName}")`);
    }
    ok(`Cancel でリセット成功: "${nameValue}"`);

    console.log("\n🎉 Profile テスト完了！\n");
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
