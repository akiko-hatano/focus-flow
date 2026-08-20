"""focus-flow の TODO CRUD テスト (Skyvern)

実行方法:
  pnpm skyvern:todo

事前準備:
  pnpm dev でアプリを起動しておく

操作は自然言語で Skyvern に指示し、検証は data-testid の Playwright API で行う。
page.act は1アクション単位なので、入力とクリックは分ける。
"""

from __future__ import annotations

from config import act, fail, get_task_id_by_title, log, ok, run, session

APP_URL = "http://localhost:3000"
TASK_TITLE = "skyvern test task"
UPDATED_TITLE = "skyvern test task (updated)"
VALIDATION_TASK_TITLE = "Validation test task"


async def main() -> None:
    print(f"\n🌐 テスト対象: {APP_URL}\n")

    async with session() as (_client, _browser, page):
        await page.goto(APP_URL)
        await page.locator('[data-testid="task-input"]').wait_for()

        log("CREATE", f'"{TASK_TITLE}" を追加する')
        await act(page, f"タスク入力欄に「{TASK_TITLE}」と入力してください。")
        await act(page, "Add ボタンをクリックしてタスクを追加してください。")
        task_id = await get_task_id_by_title(page, TASK_TITLE)
        if not task_id:
            fail(f'"{TASK_TITLE}" が一覧に見つかりません')
        ok(f'タスク確認: "{TASK_TITLE}" が一覧に存在する (id={task_id})')

        log("UPDATE (complete)", f'"{TASK_TITLE}" を完了状態にする')
        await act(page, f"「{TASK_TITLE}」というタスクのチェックボックスをクリックして完了状態にしてください。")
        title_class = await page.locator(f'[data-testid="task-title-{task_id}"]').get_attribute("class")
        if not title_class or "line-through" not in title_class:
            fail("完了状態になっていません")
        ok("完了状態に変更成功")

        log("UPDATE (edit)", f'タイトルを "{UPDATED_TITLE}" に変更する')
        await act(page, f"「{TASK_TITLE}」というタスクの編集ボタンをクリックしてください。")
        await act(
            page,
            f"編集中の入力欄の内容を全て消して「{UPDATED_TITLE}」と入力してください。",
        )
        await act(page, "編集の保存ボタンをクリックしてください。")
        updated_id = await get_task_id_by_title(page, UPDATED_TITLE)
        if not updated_id:
            fail(f'タイトルが "{UPDATED_TITLE}" に更新されていません')
        ok(f'タイトル更新成功: "{UPDATED_TITLE}"')

        log("DELETE", f'"{UPDATED_TITLE}" を削除する')
        await act(page, f"「{UPDATED_TITLE}」というタスクの削除ボタンをクリックしてください。")
        if await get_task_id_by_title(page, UPDATED_TITLE):
            fail("削除されていません")
        ok("削除成功")

        log("VALIDATION (add)", "空のタイトルで追加するとエラーが出ることを確認する")
        await act(page, "タスク入力欄が空のまま Add ボタンをクリックしてください。")
        if not await page.locator('[data-testid="add-task-error"]').is_visible():
            fail("タスク追加のバリデーションエラーが表示されていません")
        ok('バリデーションエラー確認: "タイトルを入力してください"')

        log("VALIDATION (edit)", "タスク編集で空タイトルにするとエラーが出ることを確認する")
        await act(
            page,
            f"タスク入力欄に「{VALIDATION_TASK_TITLE}」と入力してください。",
        )
        await act(page, "Add ボタンをクリックしてタスクを追加してください。")
        val_task_id = await get_task_id_by_title(page, VALIDATION_TASK_TITLE)
        if not val_task_id:
            fail(f'"{VALIDATION_TASK_TITLE}" を追加できませんでした')

        await act(page, f"「{VALIDATION_TASK_TITLE}」というタスクの編集ボタンをクリックしてください。")
        await act(page, "編集中の入力欄の内容を全て消してください。")
        await act(page, "編集の保存ボタンをクリックしてください。")
        if not await page.locator(f'[data-testid="task-item-{val_task_id}"] [role="alert"]').is_visible():
            fail("タスク編集のバリデーションエラーが表示されていません")
        ok('バリデーションエラー確認: "タイトルを入力してください"')

        await act(page, "編集中のキャンセルボタンをクリックしてください。")
        await act(page, f"「{VALIDATION_TASK_TITLE}」というタスクの削除ボタンをクリックしてください。")

        print("\n🎉 CRUD テスト完了！\n")


if __name__ == "__main__":
    run(main)
