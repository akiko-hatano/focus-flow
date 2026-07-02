/**
 * focus-flow の Profile テスト (agent-browser)
 *
 * 実行方法:
 *   pnpm agent-browser:profile
 *
 * 事前準備:
 *   pnpm dev でアプリを起動しておく
 */

import {
  clearAndType,
  click,
  closeBrowser,
  fail,
  getValue,
  isVisible,
  log,
  navigate,
  ok,
  openBrowser,
  typeText,
  waitFor,
} from "./config";

const APP_URL = "http://localhost:3000/profile";

async function main(): Promise<void> {
  console.log(`\n🌐 テスト対象: ${APP_URL}\n`);

  openBrowser(APP_URL);

  try {
    // ─────────────────────────────────────────
    // 1. プロフィールを更新して保存する
    // 名前・メールを入力して Save Changes を押し、エラーが出ないことで保存成功を確認
    // （"Updated!" ボタンは2秒で消えるためエラー有無で判定）
    // ─────────────────────────────────────────
    log("UPDATE", "名前とメールアドレスを更新して保存する");
    navigate(APP_URL);
    waitFor('[data-testid="profile-form"]');
    typeText('[data-testid="profile-name-input"]', "Test User");
    typeText('[data-testid="profile-email-input"]', "test@example.com");
    click('[data-testid="profile-save-btn"]');
    const nameErrAfterSave = isVisible('[data-testid="profile-name-error"]');
    const emailErrAfterSave = isVisible('[data-testid="profile-email-error"]');
    if (nameErrAfterSave || emailErrAfterSave) fail("保存が確認できません");
    ok("保存成功: エラーなし");

    // ─────────────────────────────────────────
    // 2. バリデーション: 名前が空
    // ページを再ロードして Jotai の状態をリセットし、名前を空のまま保存してエラーを確認
    // ─────────────────────────────────────────
    log("VALIDATION (name)", "名前を空にすると「名前を入力してください」が出ることを確認する");
    navigate(APP_URL);
    waitFor('[data-testid="profile-form"]');
    // 名前は空のまま、メールだけ有効な値を入れて保存
    typeText('[data-testid="profile-email-input"]', "test@example.com");
    click('[data-testid="profile-save-btn"]');
    const nameErrorVisible = isVisible('[data-testid="profile-name-error"]');
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
    navigate(APP_URL);
    waitFor('[data-testid="profile-form"]');
    typeText('[data-testid="profile-name-input"]', "Test User");
    typeText('[data-testid="profile-email-input"]', "test@test");
    click('[data-testid="profile-save-btn"]');
    const emailErrorVisible = isVisible('[data-testid="profile-email-error"]');
    if (!emailErrorVisible) fail('"有効なメールアドレスを入力してください" が表示されていません');
    ok('バリデーションエラー確認: "有効なメールアドレスを入力してください"');

    // ─────────────────────────────────────────
    // 4. Cancel で変更をリセットする
    // ページを再ロードし、名前を変更してから Cancel を押し、元の値に戻ることを確認
    // ─────────────────────────────────────────
    log("CANCEL", "Cancel ボタンで変更をリセットする");
    navigate(APP_URL);
    waitFor('[data-testid="profile-form"]');
    // Cancel 前の元の値を取得しておき、Cancel 後に同じ値に戻ることを確認
    const originalName = getValue('[data-testid="profile-name-input"]');
    clearAndType('[data-testid="profile-name-input"]', "Changed Name");
    click('[data-testid="profile-cancel-btn"]');
    const nameValue = getValue('[data-testid="profile-name-input"]');
    if (nameValue !== originalName) fail(`Cancel が効いていません: "${nameValue}" (期待値: "${originalName}")`);
    ok(`Cancel でリセット成功: "${nameValue}"`);

    console.log("\n🎉 Profile テスト完了！\n");
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
