/**
 * focus-flow の Profile テスト (playwright-mcp)
 *
 * 実行方法:
 *   pnpm playwright-mcp:profile
 *
 * 事前準備:
 *   pnpm dev でアプリを起動しておく
 */

import {
  clearAndType,
  click,
  createMcpClient,
  fail,
  getValue,
  isVisible,
  log,
  navigate,
  ok,
  typeText,
  waitFor,
} from "./config";

const APP_URL = "http://localhost:3000/profile";

async function main(): Promise<void> {
  console.log(`\n🌐 テスト対象: ${APP_URL}\n`);

  const client = await createMcpClient(false);

  try {
    // ─────────────────────────────────────────
    // 1. プロフィールを更新して保存する
    // 名前・メールを入力して Save Changes を押し、エラーが出ないことで保存成功を確認
    // （"Updated!" ボタンは2秒で消えるためエラー有無で判定）
    // ─────────────────────────────────────────
    log("UPDATE", "名前とメールアドレスを更新して保存する");
    await navigate(client, APP_URL);
    await waitFor(client, '[data-testid="profile-form"]');
    await typeText(client, '[data-testid="profile-name-input"]', "Test User", "Full Name 入力欄");
    await typeText(
      client,
      '[data-testid="profile-email-input"]',
      "test@example.com",
      "Email Address 入力欄",
    );
    await click(client, '[data-testid="profile-save-btn"]', "Save Changes ボタン");
    const nameErrAfterSave = await isVisible(client, '[data-testid="profile-name-error"]');
    const emailErrAfterSave = await isVisible(client, '[data-testid="profile-email-error"]');
    if (nameErrAfterSave || emailErrAfterSave) fail("保存が確認できません");
    ok("保存成功: エラーなし");

    // ─────────────────────────────────────────
    // 2. バリデーション: 名前が空
    // ページを再ロードして Jotai の状態をリセットし、名前を空のまま保存してエラーを確認
    // ─────────────────────────────────────────
    log("VALIDATION (name)", "名前を空にすると「名前を入力してください」が出ることを確認する");
    await navigate(client, APP_URL);
    await waitFor(client, '[data-testid="profile-form"]');
    // 名前は空のまま、メールだけ有効な値を入れて保存
    await typeText(
      client,
      '[data-testid="profile-email-input"]',
      "test@example.com",
      "Email Address 入力欄",
    );
    await click(client, '[data-testid="profile-save-btn"]', "Save Changes ボタン");
    const nameErrorVisible = await isVisible(client, '[data-testid="profile-name-error"]');
    if (!nameErrorVisible) fail('"名前を入力してください" が表示されていません');
    ok('バリデーションエラー確認: "名前を入力してください"');

    // ─────────────────────────────────────────
    // 3. バリデーション: メールアドレスが不正
    // ページを再ロードし、形式不正のメールアドレスで保存してエラーを確認
    // ─────────────────────────────────────────
    log(
      "VALIDATION (email)",
      "不正なメールアドレスで「有効なメールアドレスを入力してください」が出ることを確認する",
    );
    await navigate(client, APP_URL);
    await waitFor(client, '[data-testid="profile-form"]');
    await typeText(client, '[data-testid="profile-name-input"]', "Test User", "Full Name 入力欄");
    await typeText(
      client,
      '[data-testid="profile-email-input"]',
      "test@test",
      "Email Address 入力欄",
    );
    await click(client, '[data-testid="profile-save-btn"]', "Save Changes ボタン");
    const emailErrorVisible = await isVisible(client, '[data-testid="profile-email-error"]');
    if (!emailErrorVisible) fail('"有効なメールアドレスを入力してください" が表示されていません');
    ok('バリデーションエラー確認: "有効なメールアドレスを入力してください"');

    // ─────────────────────────────────────────
    // 4. Cancel で変更をリセットする
    // ページを再ロードし、名前を変更してから Cancel を押し、元の値に戻ることを確認
    // ─────────────────────────────────────────
    log("CANCEL", "Cancel ボタンで変更をリセットする");
    await navigate(client, APP_URL);
    await waitFor(client, '[data-testid="profile-form"]');
    await clearAndType(
      client,
      '[data-testid="profile-name-input"]',
      "Changed Name",
      "Full Name 入力欄",
    );
    await click(client, '[data-testid="profile-cancel-btn"]', "Cancel ボタン");
    const nameValue = await getValue(client, '[data-testid="profile-name-input"]');
    if (nameValue === "Changed Name") fail(`Cancel が効いていません: "${nameValue}"`);
    ok(`Cancel でリセット成功: "${nameValue}"`);

    console.log("\n🎉 Profile テスト完了！\n");
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
