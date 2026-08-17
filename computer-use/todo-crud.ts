/**
 * focus-flow の TODO CRUD テスト (computer-use)
 *
 * 実行方法:
 *   pnpm computer-use:todo
 *
 * 事前準備:
 *   pnpm dev でアプリを起動しておく
 *
 * 操作は自然言語のタスクとしてClaude（Computer Use）に指示し、
 * 検証（存在確認・状態確認）は data-testid を使った素の Playwright API で行う。
 */

import type { Page } from "playwright";
import { createBrowser, fail, log, ok, runAgentTask } from "./config";

const APP_URL = "http://localhost:3000";
const TASK_TITLE = "computer-use test task";
const UPDATED_TITLE = "computer-use test task (updated)";
const VALIDATION_TASK_TITLE = "Validation test task";

// タイトルが一致するタスクの id を DOM から取得する（AI を使わない素の Playwright 操作）
async function getTaskIdByTitle(page: Page, title: string): Promise<string> {
  return page.evaluate((t) => {
    const items = document.querySelectorAll('[data-testid^="task-item-"]');
    for (const item of items) {
      const testId = item.getAttribute("data-testid") ?? "";
      const id = testId.replace("task-item-", "");
      const titleEl = item.querySelector(`[data-testid="task-title-${id}"]`);
      if (titleEl?.textContent?.trim() === t) return id;
    }
    return "";
  }, title);
}

async function main(): Promise<void> {
  console.log(`\n🌐 テスト対象: ${APP_URL}\n`);

  const { browser, page } = await createBrowser(false);

  try {
    await page.goto(APP_URL);
    await page.waitForSelector('[data-testid="task-input"]');

    // ─────────────────────────────────────────
    // CREATE: タスクを追加する
    // ─────────────────────────────────────────
    log("CREATE", `"${TASK_TITLE}" を追加する`);
    await runAgentTask(
      page,
      `タスク入力欄に「${TASK_TITLE}」と入力し、Add ボタンをクリックしてタスクを追加してください。完了したら "done" と一言だけ返してください。`,
    );
    const taskId = await getTaskIdByTitle(page, TASK_TITLE);
    if (!taskId) fail(`"${TASK_TITLE}" が一覧に見つかりません`);
    ok(`タスク確認: "${TASK_TITLE}" が一覧に存在する (id=${taskId})`);

    // ─────────────────────────────────────────
    // UPDATE: 完了状態にする
    // ─────────────────────────────────────────
    log("UPDATE (complete)", `"${TASK_TITLE}" を完了状態にする`);
    await runAgentTask(
      page,
      `「${TASK_TITLE}」というタスクのチェックボックスをクリックして完了状態にしてください。完了したら "done" と一言だけ返してください。`,
    );
    const titleClass = await page.locator(`[data-testid="task-title-${taskId}"]`).getAttribute("class");
    if (!titleClass?.includes("line-through")) fail("完了状態になっていません");
    ok("完了状態に変更成功");

    // ─────────────────────────────────────────
    // UPDATE: タイトルを編集する
    // ─────────────────────────────────────────
    log("UPDATE (edit)", `タイトルを "${UPDATED_TITLE}" に変更する`);
    await runAgentTask(
      page,
      `「${TASK_TITLE}」というタスクの編集ボタンをクリックし、入力欄の内容を全て選択して削除し、「${UPDATED_TITLE}」と入力してから保存ボタンをクリックしてください。完了したら "done" と一言だけ返してください。`,
    );
    const updatedId = await getTaskIdByTitle(page, UPDATED_TITLE);
    if (!updatedId) fail(`タイトルが "${UPDATED_TITLE}" に更新されていません`);
    ok(`タイトル更新成功: "${UPDATED_TITLE}"`);

    // ─────────────────────────────────────────
    // DELETE: タスクを削除する
    // ─────────────────────────────────────────
    log("DELETE", `"${UPDATED_TITLE}" を削除する`);
    await runAgentTask(
      page,
      `「${UPDATED_TITLE}」というタスクの削除ボタンをクリックしてください。完了したら "done" と一言だけ返してください。`,
    );
    const stillExists = await getTaskIdByTitle(page, UPDATED_TITLE);
    if (stillExists) fail("削除されていません");
    ok("削除成功");

    // ─────────────────────────────────────────
    // VALIDATION: タスク追加のバリデーション
    // ─────────────────────────────────────────
    log("VALIDATION (add)", "空のタイトルで追加するとエラーが出ることを確認する");
    await runAgentTask(
      page,
      `タスク入力欄が空のまま Add ボタンをクリックしてください。完了したら "done" と一言だけ返してください。`,
    );
    const addErrorVisible = await page.locator('[data-testid="add-task-error"]').isVisible();
    if (!addErrorVisible) fail("タスク追加のバリデーションエラーが表示されていません");
    ok('バリデーションエラー確認: "タイトルを入力してください"');

    // ─────────────────────────────────────────
    // VALIDATION: タスク編集のバリデーション
    // ─────────────────────────────────────────
    log("VALIDATION (edit)", "タスク編集で空タイトルにするとエラーが出ることを確認する");
    await runAgentTask(
      page,
      `タスク入力欄に「${VALIDATION_TASK_TITLE}」と入力し、Add ボタンをクリックしてタスクを追加してください。完了したら "done" と一言だけ返してください。`,
    );
    const valTaskId = await getTaskIdByTitle(page, VALIDATION_TASK_TITLE);
    if (!valTaskId) fail(`"${VALIDATION_TASK_TITLE}" を追加できませんでした`);

    await runAgentTask(
      page,
      `「${VALIDATION_TASK_TITLE}」というタスクの編集ボタンをクリックし、入力欄の内容を全て選択して削除してから保存ボタンをクリックしてください。完了したら "done" と一言だけ返してください。`,
    );
    const editErrorVisible = await page
      .locator(`[data-testid="task-item-${valTaskId}"] [role="alert"]`)
      .isVisible();
    if (!editErrorVisible) fail("タスク編集のバリデーションエラーが表示されていません");
    ok('バリデーションエラー確認: "タイトルを入力してください"');

    // 後片付け: 編集をキャンセルして検証用タスクを削除
    await runAgentTask(
      page,
      `編集中の「${VALIDATION_TASK_TITLE}」のキャンセルボタンをクリックし、その後同じタスクの削除ボタンをクリックしてください。完了したら "done" と一言だけ返してください。`,
    );

    console.log("\n🎉 CRUD テスト完了！\n");
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
