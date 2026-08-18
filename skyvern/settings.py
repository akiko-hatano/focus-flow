"""focus-flow の Settings テスト (Skyvern)

実行方法:
  pnpm skyvern:settings

事前準備:
  pnpm dev でアプリを起動しておく
"""

from __future__ import annotations

from config import act, fail, log, ok, run, session

APP_URL = "http://localhost:3000/settings"


async def get_selected_theme_label(page) -> str:
    text = await page.locator('[data-testid="selected-theme-label"]').text_content()
    return (text or "").replace("選択中: ", "").strip()


async def get_first_other_theme(page, current_theme_label: str) -> dict[str, str]:
    swatches = page.locator('[data-testid^="theme-swatch-"]')
    count = await swatches.count()
    for i in range(count):
        swatch = swatches.nth(i)
        label = await swatch.get_attribute("aria-label") or ""
        if current_theme_label not in label:
            test_id = await swatch.get_attribute("data-testid") or ""
            return {"id": test_id.removeprefix("theme-swatch-"), "label": label}
    return {"id": "", "label": ""}


async def main() -> None:
    print(f"\n🌐 テスト対象: {APP_URL}\n")

    async with session() as (_client, _browser, page):
        await page.goto(APP_URL)
        await page.locator('[data-testid="theme-selector"]').wait_for()

        log("READ", "現在のテーマを確認する")
        current_theme = await get_selected_theme_label(page)
        if not current_theme:
            fail("現在のテーマを取得できませんでした")
        ok(f'現在のテーマ: "{current_theme}"')

        log("UPDATE", "別のテーマに切り替える")
        other = await get_first_other_theme(page, current_theme)
        if not other["id"]:
            fail("切り替え先のテーマが見つかりません")

        await act(
            page,
            f"テーマ選択画面には複数の色のスウォッチが並んでいます。"
            f"現在「{current_theme}」が選択中です。"
            "それ以外のスウォッチを1つクリックしてテーマを切り替えてください。",
        )

        new_theme = await get_selected_theme_label(page)
        if new_theme == current_theme:
            fail(f'テーマが変わっていません: "{new_theme}"')
        ok(f'テーマ変更成功: "{current_theme}" → "{new_theme}"')

        print("\n🎉 Settings テスト完了！\n")


if __name__ == "__main__":
    run(main)
