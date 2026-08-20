"""focus-flow の Profile テスト (Skyvern)

実行方法:
  pnpm skyvern:profile

事前準備:
  pnpm dev でアプリを起動しておく
"""

from __future__ import annotations

from config import act, fail, log, ok, run, session

APP_URL = "http://localhost:3000/profile"


async def main() -> None:
    print(f"\n🌐 テスト対象: {APP_URL}\n")

    async with session() as (_client, _browser, page):
        log("UPDATE", "名前とメールアドレスを更新して保存する")
        await page.goto(APP_URL)
        await page.locator('[data-testid="profile-form"]').wait_for()
        await act(page, "Full Name 入力欄に「Test User」と入力してください。")
        await act(
            page,
            "Email Address 入力欄に「test@example.com」と入力してください。",
        )
        await act(page, "Save Changes ボタンをクリックしてください。")
        if await page.locator('[data-testid="profile-name-error"]').is_visible():
            fail("保存が確認できません")
        if await page.locator('[data-testid="profile-email-error"]').is_visible():
            fail("保存が確認できません")
        ok("保存成功: エラーなし")

        log("VALIDATION (name)", "名前を空にすると「名前を入力してください」が出ることを確認する")
        await page.goto(APP_URL)
        await page.locator('[data-testid="profile-form"]').wait_for()
        await act(page, "Full Name 入力欄の内容を全て消してください。")
        await act(
            page,
            "Email Address 入力欄に「test@example.com」と入力してください。",
        )
        await act(page, "Save Changes ボタンをクリックしてください。")
        if not await page.locator('[data-testid="profile-name-error"]').is_visible():
            fail('"名前を入力してください" が表示されていません')
        ok('バリデーションエラー確認: "名前を入力してください"')

        log(
            "VALIDATION (email)",
            "不正なメールアドレスで「有効なメールアドレスを入力してください」が出ることを確認する",
        )
        await page.goto(APP_URL)
        await page.locator('[data-testid="profile-form"]').wait_for()
        await act(page, "Full Name 入力欄に「Test User」と入力してください。")
        await act(page, "Email Address 入力欄に「test@test」と入力してください。")
        await act(page, "Save Changes ボタンをクリックしてください。")
        if not await page.locator('[data-testid="profile-email-error"]').is_visible():
            fail('"有効なメールアドレスを入力してください" が表示されていません')
        ok('バリデーションエラー確認: "有効なメールアドレスを入力してください"')

        log("CANCEL", "Cancel ボタンで変更をリセットする")
        await page.goto(APP_URL)
        await page.locator('[data-testid="profile-form"]').wait_for()
        original_name = await page.locator('[data-testid="profile-name-input"]').input_value()
        await act(page, "Full Name 入力欄に「Changed Name」と入力してください。")
        await act(page, "Cancel ボタンをクリックしてください。")
        name_value = await page.locator('[data-testid="profile-name-input"]').input_value()
        if name_value != original_name:
            fail(f'Cancel が効いていません: "{name_value}" (期待値: "{original_name}")')
        ok(f'Cancel でリセット成功: "{name_value}"')

        print("\n🎉 Profile テスト完了！\n")


if __name__ == "__main__":
    run(main)
