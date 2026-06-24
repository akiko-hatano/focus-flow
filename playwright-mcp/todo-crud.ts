/**
 * focus-flow の TODO CRUD テスト (playwright-mcp)
 *
 * 実行方法:
 *   pnpm playwright-mcp:todo
 *
 * 事前準備:
 *   pnpm dev でアプリを起動しておく
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  clearAndType,
  click,
  createMcpClient,
  fail,
  getAttribute,
  isVisible,
  log,
  navigate,
  ok,
  typeText,
  waitFor,
} from "./config";

const APP_URL = "http://localhost:3000";
const TASK_TITLE = "playwright-mcp test task";
const UPDATED_TITLE = "playwright-mcp test task (updated)";
const VALIDATION_TASK_TITLE = "Validation test task";

// タイトルが一致するタスクの id を DOM から取得する
// タスクの操作（チェック・編集・削除）は data-testid に id が含まれるため、
// 操作前にこの関数で id を特定してからセレクターを組み立てる
async function getTaskIdByTitle(client: Client, title: string): Promise<string> {
  const result = await client.callTool({
    name: "browser_evaluate",
    arguments: {
      function: `() => {
        const items = document.querySelectorAll('[data-testid^="task-item-"]');
        for (const item of items) {
          const testId = item.getAttribute('data-testid') ?? '';
          const id = testId.replace('task-item-', '');
          const titleEl = item.querySelector('[data-testid="task-title-' + id + '"]');
          if (titleEl?.textContent?.includes(${JSON.stringify(title)})) return id;
        }
        return '';
      }`,
    },
  });
  const raw = (result.content as Array<{ type: string; text: string }>).map((c) => c.text).join("");
  const match = raw.match(/###\s*Result\s*\n([\s\S]*?)(?:\n###|$)/);
  const val = match ? match[1].trim() : raw.trim();
  return val.replace(/^"|"$/g, "");
}

async function main(): Promise<void> {
  console.log(`\n🌐 テスト対象: ${APP_URL}\n`);

  const client = await createMcpClient(false);

  try {
    await navigate(client, APP_URL);
    await waitFor(client, '[data-testid="task-input"]');

    // ─────────────────────────────────────────
    // CREATE: タスクを追加する
    // 入力欄にタイトルを入力して Add ボタンを押す
    // ─────────────────────────────────────────
    log("CREATE", `"${TASK_TITLE}" を追加する`);
    await typeText(client, '[data-testid="task-input"]', TASK_TITLE, "タスク入力欄");
    await click(client, '[data-testid="add-task-btn"]', "Add ボタン");
    ok("タスクを追加した");

    // ─────────────────────────────────────────
    // READ: タスクが表示されているか確認
    // DOM を走査してタイトルが一致する task-item の id を取得する
    // ─────────────────────────────────────────
    log("READ", "タスク一覧を確認する");
    const taskId = await getTaskIdByTitle(client, TASK_TITLE);
    if (!taskId) fail(`"${TASK_TITLE}" が一覧に見つかりません`);
    ok(`タスク確認: "${TASK_TITLE}" が一覧に存在する (id=${taskId})`);

    // ─────────────────────────────────────────
    // UPDATE: 完了状態にする
    // チェックボックスをクリックし、タイトル要素に line-through が付くことで完了を確認
    // ─────────────────────────────────────────
    log("UPDATE (complete)", `"${TASK_TITLE}" を完了状態にする`);
    await click(
      client,
      `[data-testid="task-checkbox-${taskId}"]`,
      `"${TASK_TITLE}" のチェックボックス`,
    );
    const titleClass = await getAttribute(client, `[data-testid="task-title-${taskId}"]`, "class");
    if (!titleClass.includes("line-through")) fail("完了状態になっていません");
    ok("完了状態に変更成功");

    // ─────────────────────────────────────────
    // UPDATE: タイトルを編集する
    // 編集ボタン → 入力欄を書き換え → 保存ボタン の順に操作し、
    // 更新後のタイトルで DOM を再検索して反映を確認
    // ─────────────────────────────────────────
    log("UPDATE (edit)", `タイトルを "${UPDATED_TITLE}" に変更する`);
    await click(
      client,
      `[data-testid="task-edit-${taskId}"]`,
      `"${TASK_TITLE}" の編集ボタン`,
    );
    await clearAndType(
      client,
      `[data-testid="task-edit-input-${taskId}"]`,
      UPDATED_TITLE,
      "タスク編集入力欄",
    );
    await click(client, `[data-testid="task-save-${taskId}"]`, "保存ボタン");
    const updatedId = await getTaskIdByTitle(client, UPDATED_TITLE);
    if (!updatedId) fail(`タイトルが "${UPDATED_TITLE}" に更新されていません`);
    ok(`タイトル更新成功: "${UPDATED_TITLE}"`);

    // ─────────────────────────────────────────
    // DELETE: タスクを削除する
    // 削除ボタンをクリックし、同タイトルの要素が DOM から消えることを確認
    // ─────────────────────────────────────────
    log("DELETE", `"${UPDATED_TITLE}" を削除する`);
    await click(
      client,
      `[data-testid="task-delete-${updatedId}"]`,
      `"${UPDATED_TITLE}" の削除ボタン`,
    );
    const stillExists = await getTaskIdByTitle(client, UPDATED_TITLE);
    if (stillExists) fail("削除されていません");
    ok("削除成功");

    // ─────────────────────────────────────────
    // VALIDATION: タスク追加のバリデーション
    // 入力欄が空のまま Add を押し、エラーメッセージ要素が表示されることを確認
    // ─────────────────────────────────────────
    log("VALIDATION (add)", "空のタイトルで追加するとエラーが出ることを確認する");
    await click(client, '[data-testid="add-task-btn"]', "Add ボタン（空入力）");
    const addErrorVisible = await isVisible(client, '[data-testid="add-task-error"]');
    if (!addErrorVisible) fail("タスク追加のバリデーションエラーが表示されていません");
    ok('バリデーションエラー確認: "タイトルを入力してください"');

    // ─────────────────────────────────────────
    // VALIDATION: タスク編集のバリデーション
    // 検証用タスクを追加し、編集中に空タイトルで保存しようとするとエラーが出ることを確認
    // ─────────────────────────────────────────
    log("VALIDATION (edit)", "タスク編集で空タイトルにするとエラーが出ることを確認する");
    await typeText(client, '[data-testid="task-input"]', VALIDATION_TASK_TITLE, "タスク入力欄");
    await click(client, '[data-testid="add-task-btn"]', "Add ボタン");
    const valTaskId = await getTaskIdByTitle(client, VALIDATION_TASK_TITLE);
    if (!valTaskId) fail(`"${VALIDATION_TASK_TITLE}" を追加できませんでした`);

    await click(
      client,
      `[data-testid="task-edit-${valTaskId}"]`,
      `"${VALIDATION_TASK_TITLE}" の編集ボタン`,
    );
    await clearAndType(
      client,
      `[data-testid="task-edit-input-${valTaskId}"]`,
      "",
      "タスク編集入力欄",
    );
    await click(client, `[data-testid="task-save-${valTaskId}"]`, "保存ボタン");
    const editErrorVisible = await isVisible(
      client,
      `[data-testid="task-item-${valTaskId}"] [role="alert"]`,
    );
    if (!editErrorVisible) fail("タスク編集のバリデーションエラーが表示されていません");
    ok('バリデーションエラー確認: "タイトルを入力してください"');

    // 後片付け: 編集をキャンセルして検証用タスクを削除
    await click(client, `[data-testid="task-cancel-${valTaskId}"]`, "キャンセルボタン");
    await click(
      client,
      `[data-testid="task-delete-${valTaskId}"]`,
      `"${VALIDATION_TASK_TITLE}" の削除ボタン`,
    );

    console.log("\n🎉 CRUD テスト完了！\n");
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
