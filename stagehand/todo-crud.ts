/**
 * focus-flow の TODO CRUD テスト
 *
 * 実行方法:
 *   pnpm stagehand:todo
 *
 * 事前準備:
 *   pnpm dev でアプリを起動しておく
 */

import { Stagehand, AISdkClient } from "@browserbasehq/stagehand";
import { z } from "zod";
import { bedrock, modelId, log, ok, fail } from "./config";

const APP_URL = "http://localhost:3000";
const TASK_TITLE = "Stagehand test task";
const UPDATED_TITLE = "Stagehand test task (updated)";

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
    // CREATE: タスクを追加する
    // ─────────────────────────────────────────
    log("CREATE", `"${TASK_TITLE}" を追加する`);
    await stagehand.act(`"Add a new task..." と書かれた入力欄に "${TASK_TITLE}" と入力して`);
    await stagehand.act(`"Add" ボタンをクリックして`);
    ok("タスクを追加した");

    // ─────────────────────────────────────────
    // READ: タスクが表示されているか確認
    // ─────────────────────────────────────────
    log("READ", "タスク一覧を確認する");
    const { tasks } = await stagehand.extract(
      "ページに表示されているタスクのタイトルをすべて取得して",
      z.object({ tasks: z.array(z.string()).describe("タスクのタイトル一覧") }),
    );
    if (!tasks.some((t) => t.includes("Stagehand"))) fail(`"${TASK_TITLE}" が一覧に見つかりません`);
    ok(`タスク確認: ${tasks.join(", ")}`);

    // ─────────────────────────────────────────
    // UPDATE: 完了状態にする
    // ─────────────────────────────────────────
    log("UPDATE (complete)", `"${TASK_TITLE}" を完了状態にする`);
    await stagehand.act(`"${TASK_TITLE}" の左にあるチェックボックスをクリックして`);
    const { completed } = await stagehand.extract(
      `"${TASK_TITLE}" のタスクが完了状態（取り消し線がついている）になっているか確認して`,
      z.object({ completed: z.boolean().describe("完了状態かどうか") }),
    );
    if (!completed) fail("完了状態になっていません");
    ok("完了状態に変更成功");

    // ─────────────────────────────────────────
    // UPDATE: タイトルを編集する
    // ─────────────────────────────────────────
    log("UPDATE (edit)", `タイトルを "${UPDATED_TITLE}" に変更する`);
    await stagehand.act(`"${TASK_TITLE}" の編集ボタン（鉛筆アイコン）をクリックして`);
    await stagehand.act(`編集中の入力欄のテキストをすべて消して "${UPDATED_TITLE}" と入力して`);
    await stagehand.act(`保存ボタン（チェックアイコン）をクリックして`);
    const { title } = await stagehand.extract(
      `"updated" という文字を含むタスクのタイトルを取得して`,
      z.object({ title: z.string().describe("更新後のタスクタイトル") }),
    );
    if (!title.includes("updated")) fail(`タイトルが更新されていません: "${title}"`);
    ok(`タイトル更新成功: "${title}"`);

    // ─────────────────────────────────────────
    // DELETE: タスクを削除する
    // ─────────────────────────────────────────
    log("DELETE", `"${UPDATED_TITLE}" を削除する`);
    await stagehand.act(`"${UPDATED_TITLE}" の削除ボタン（ゴミ箱アイコン）をクリックして`);
    const { tasks: remainingTasks } = await stagehand.extract(
      "ページに表示されているタスクのタイトルをすべて取得して。タスクがなければ空の配列を返して",
      z.object({ tasks: z.array(z.string()).describe("残っているタスク一覧") }),
    );
    if (remainingTasks.some((t) => t.includes("Stagehand"))) fail("削除されていません");
    ok("削除成功");

    // ─────────────────────────────────────────
    // VALIDATION: タスク追加のバリデーション
    // ─────────────────────────────────────────
    log("VALIDATION (add)", "空のタイトルで追加するとエラーが出ることを確認する");
    await stagehand.act(`"Add a new task..." と書かれた入力欄を空のままにして "Add" ボタンをクリックして`);
    const { addError } = await stagehand.extract(
      `"タイトルを入力してください" というエラーメッセージが表示されているか確認して`,
      z.object({ addError: z.boolean().describe("エラーメッセージが表示されているか") }),
    );
    if (!addError) fail("タスク追加のバリデーションエラーが表示されていません");
    ok(`バリデーションエラー確認: "タイトルを入力してください"`);

    // ─────────────────────────────────────────
    // VALIDATION: タスク編集のバリデーション
    // ─────────────────────────────────────────
    log("VALIDATION (edit)", "タスク編集で空タイトルにするとエラーが出ることを確認する");

    // テスト用タスクを追加
    await stagehand.act(`"Add a new task..." の入力欄に "Validation test task" と入力して`);
    await stagehand.act(`"Add" ボタンをクリックして`);
    await stagehand.act(`"Validation test task" の編集ボタン（鉛筆アイコン）をクリックして`);
    await stagehand.act(`編集中の入力欄のテキストをすべて消して空にして`);
    await stagehand.act(`保存ボタン（チェックアイコン）をクリックして`);
    const { editError } = await stagehand.extract(
      `"タイトルを入力してください" というエラーメッセージが表示されているか確認して`,
      z.object({ editError: z.boolean().describe("エラーメッセージが表示されているか") }),
    );
    if (!editError) fail("タスク編集のバリデーションエラーが表示されていません");
    ok(`バリデーションエラー確認: "タイトルを入力してください"`);
    // キャンセルして後処理
    await stagehand.act(`キャンセルボタン（×アイコン）をクリックして`);
    await stagehand.act(`"Validation test task" の削除ボタン（ゴミ箱アイコン）をクリックして`);

    console.log("\n🎉 CRUD テスト完了！\n");
  } finally {
    await stagehand.close();
  }
}

main().catch((err) => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
