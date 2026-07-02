/**
 * focus-flow の TODO CRUD テスト (agent-browser)
 *
 * 実行方法:
 *   pnpm agent-browser:todo
 *
 * 事前準備:
 *   pnpm dev でアプリを起動しておく
 */

import {
  clearAndType,
  click,
  closeBrowser,
  evalJs,
  fail,
  getAttribute,
  isVisible,
  log,
  navigate,
  ok,
  openBrowser,
  typeText,
  waitFor,
} from "./config";

const APP_URL = "http://localhost:3000";
const TASK_TITLE = "agent-browser test task";
const UPDATED_TITLE = "agent-browser test task (updated)";
const VALIDATION_TASK_TITLE = "Validation test task";

// タイトルが一致するタスクの id を DOM から取得する
// タスクの操作（チェック・編集・削除）は data-testid に id が含まれるため、
// 操作前にこの関数で id を特定してからセレクターを組み立てる
function getTaskIdByTitle(title: string): string {
  return evalJs<string>(`(() => {
    const items = document.querySelectorAll('[data-testid^="task-item-"]');
    for (const item of items) {
      const testId = item.getAttribute('data-testid') ?? '';
      const id = testId.replace('task-item-', '');
      const titleEl = item.querySelector('[data-testid="task-title-' + id + '"]');
      if (titleEl?.textContent?.trim() === ${JSON.stringify(title)}) return id;
    }
    return '';
  })()`);
}

async function main(): Promise<void> {
  console.log(`\n🌐 テスト対象: ${APP_URL}\n`);

  openBrowser(APP_URL);

  try {
    navigate(APP_URL);
    waitFor('[data-testid="task-input"]');

    // ─────────────────────────────────────────
    // CREATE: タスクを追加する
    // 入力欄にタイトルを入力して Add ボタンを押す
    // ─────────────────────────────────────────
    log("CREATE", `"${TASK_TITLE}" を追加する`);
    typeText('[data-testid="task-input"]', TASK_TITLE);
    click('[data-testid="add-task-btn"]');
    ok("タスクを追加した");

    // ─────────────────────────────────────────
    // READ: タスクが表示されているか確認
    // DOM を走査してタイトルが一致する task-item の id を取得する
    // ─────────────────────────────────────────
    log("READ", "タスク一覧を確認する");
    const taskId = getTaskIdByTitle(TASK_TITLE);
    if (!taskId) fail(`"${TASK_TITLE}" が一覧に見つかりません`);
    ok(`タスク確認: "${TASK_TITLE}" が一覧に存在する (id=${taskId})`);

    // ─────────────────────────────────────────
    // UPDATE: 完了状態にする
    // チェックボックスをクリックし、タイトル要素に line-through が付くことで完了を確認
    // ─────────────────────────────────────────
    log("UPDATE (complete)", `"${TASK_TITLE}" を完了状態にする`);
    click(`[data-testid="task-checkbox-${taskId}"]`);
    const titleClass = getAttribute(`[data-testid="task-title-${taskId}"]`, "class");
    if (!titleClass.includes("line-through")) fail("完了状態になっていません");
    ok("完了状態に変更成功");

    // ─────────────────────────────────────────
    // UPDATE: タイトルを編集する
    // 編集ボタン → 入力欄を書き換え → 保存ボタン の順に操作し、
    // 更新後のタイトルで DOM を再検索して反映を確認
    // ─────────────────────────────────────────
    log("UPDATE (edit)", `タイトルを "${UPDATED_TITLE}" に変更する`);
    click(`[data-testid="task-edit-${taskId}"]`);
    clearAndType(`[data-testid="task-edit-input-${taskId}"]`, UPDATED_TITLE);
    click(`[data-testid="task-save-${taskId}"]`);
    const updatedId = getTaskIdByTitle(UPDATED_TITLE);
    if (!updatedId) fail(`タイトルが "${UPDATED_TITLE}" に更新されていません`);
    ok(`タイトル更新成功: "${UPDATED_TITLE}"`);

    // ─────────────────────────────────────────
    // DELETE: タスクを削除する
    // 削除ボタンをクリックし、同タイトルの要素が DOM から消えることを確認
    // ─────────────────────────────────────────
    log("DELETE", `"${UPDATED_TITLE}" を削除する`);
    click(`[data-testid="task-delete-${updatedId}"]`);
    const stillExists = getTaskIdByTitle(UPDATED_TITLE);
    if (stillExists) fail("削除されていません");
    ok("削除成功");

    // ─────────────────────────────────────────
    // VALIDATION: タスク追加のバリデーション
    // 入力欄が空のまま Add を押し、エラーメッセージ要素が表示されることを確認
    // ─────────────────────────────────────────
    log("VALIDATION (add)", "空のタイトルで追加するとエラーが出ることを確認する");
    click('[data-testid="add-task-btn"]');
    const addErrorVisible = isVisible('[data-testid="add-task-error"]');
    if (!addErrorVisible) fail("タスク追加のバリデーションエラーが表示されていません");
    ok('バリデーションエラー確認: "タイトルを入力してください"');

    // ─────────────────────────────────────────
    // VALIDATION: タスク編集のバリデーション
    // 検証用タスクを追加し、編集中に空タイトルで保存しようとするとエラーが出ることを確認
    // ─────────────────────────────────────────
    log("VALIDATION (edit)", "タスク編集で空タイトルにするとエラーが出ることを確認する");
    typeText('[data-testid="task-input"]', VALIDATION_TASK_TITLE);
    click('[data-testid="add-task-btn"]');
    const valTaskId = getTaskIdByTitle(VALIDATION_TASK_TITLE);
    if (!valTaskId) fail(`"${VALIDATION_TASK_TITLE}" を追加できませんでした`);

    click(`[data-testid="task-edit-${valTaskId}"]`);
    clearAndType(`[data-testid="task-edit-input-${valTaskId}"]`, "");
    click(`[data-testid="task-save-${valTaskId}"]`);
    const editErrorVisible = isVisible(`[data-testid="task-item-${valTaskId}"] [role="alert"]`);
    if (!editErrorVisible) fail("タスク編集のバリデーションエラーが表示されていません");
    ok('バリデーションエラー確認: "タイトルを入力してください"');

    // 後片付け: 編集をキャンセルして検証用タスクを削除
    click(`[data-testid="task-cancel-${valTaskId}"]`);
    click(`[data-testid="task-delete-${valTaskId}"]`);

    console.log("\n🎉 CRUD テスト完了！\n");
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
