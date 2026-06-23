/**
 * focus-flow の TODO CRUD テスト (browser-use)
 *
 * 実行方法:
 *   pnpm browser-use:todo
 *
 * 事前準備:
 *   pnpm dev でアプリを起動しておく
 */

import { fail, getLlm, log, makeAgent, makeBrowser, ok } from "./config";

const APP_URL = "http://localhost:3000";
const TASK_TITLE = "browser-use test task";
const UPDATED_TITLE = "browser-use test task (updated)";
const VALIDATION_TASK_TITLE = "Validation test task";

async function main(): Promise<void> {
  const { llm, modelId } = getLlm();
  console.log(`\n🤖 モデル: ${modelId}`);
  console.log(`🌐 テスト対象: ${APP_URL}\n`);

  const browser = makeBrowser();

  try {
    log("CREATE", `"${TASK_TITLE}" を追加する`);
    const createResult = await makeAgent({
      task:
        `${APP_URL} を開いて、` +
        `"Add a new task..." の入力欄に "${TASK_TITLE}" と入力し、` +
        `"Add" ボタンをクリックしてください。` +
        `成功したら "success"、失敗したら "fail: 理由" と返してください。`,
      llm,
      browser,
    }).run(10);
    const createFinal = (createResult.final_result() ?? "").toLowerCase();
    if (createFinal.includes("fail") || !createFinal.includes("success")) {
      fail(`タスク追加に失敗しました: ${createResult.final_result()}`);
    }
    ok("タスクを追加した");

    log("READ", "タスク一覧を確認する");
    const readResult = await makeAgent({
      task:
        "現在のページに表示されているタスク一覧を確認し、" +
        `"${TASK_TITLE}" が存在するかどうかを教えてください。` +
        '存在する場合は "found"、存在しない場合は "not found" と返してください。',
      llm,
      browser,
    }).run(5);
    const readFinal = (readResult.final_result() ?? "").toLowerCase();
    if (readFinal.includes("not found") || !readFinal.includes("found")) {
      fail(`"${TASK_TITLE}" が一覧に見つかりません`);
    }
    ok(`タスク確認: "${TASK_TITLE}" が一覧に存在する`);

    log("UPDATE (complete)", `"${TASK_TITLE}" を完了状態にする`);
    const completeResult = await makeAgent({
      task:
        `"${TASK_TITLE}" の左にあるチェックボックスをクリックして完了状態にしてください。` +
        "完了後、タスクに取り消し線が表示されているか確認し、" +
        '表示されていれば "completed"、いなければ "not completed" と返してください。',
      llm,
      browser,
    }).run(10);
    const completeFinal = (completeResult.final_result() ?? "").toLowerCase();
    if (completeFinal.includes("not completed") || !completeFinal.includes("completed")) {
      fail("完了状態になっていません");
    }
    ok("完了状態に変更成功");

    log("UPDATE (edit)", `タイトルを "${UPDATED_TITLE}" に変更する`);
    const editResult = await makeAgent({
      task:
        `"${TASK_TITLE}" の編集ボタン（鉛筆アイコン）をクリックし、` +
        `入力欄のテキストをすべて消して "${UPDATED_TITLE}" と入力し、` +
        "保存ボタン（チェックアイコン）をクリックしてください。" +
        `タイトルが "${UPDATED_TITLE}" に変わっていれば "updated"、` +
        '変わっていなければ "not updated" と返してください。',
      llm,
      browser,
    }).run(15);
    const editFinal = (editResult.final_result() ?? "").toLowerCase();
    if (editFinal.includes("not updated") || !editFinal.includes("updated")) {
      fail(`タイトルが更新されていません: ${editResult.final_result()}`);
    }
    ok(`タイトル更新成功: "${UPDATED_TITLE}"`);

    log("DELETE", `"${UPDATED_TITLE}" を削除する`);
    const deleteResult = await makeAgent({
      task:
        `"${UPDATED_TITLE}" の削除ボタン（ゴミ箱アイコン）をクリックしてください。` +
        `削除後、タスク一覧に "${UPDATED_TITLE}" が残っていなければ "deleted"、` +
        '残っていれば "not deleted" と返してください。',
      llm,
      browser,
    }).run(10);
    const deleteFinal = (deleteResult.final_result() ?? "").toLowerCase();
    if (deleteFinal.includes("not deleted") || !deleteFinal.includes("deleted")) {
      fail("削除されていません");
    }
    ok("削除成功");

    log("VALIDATION (add)", "空のタイトルで追加するとエラーが出ることを確認する");
    const valAddResult = await makeAgent({
      task:
        '"Add a new task..." の入力欄を空のままにして "Add" ボタンをクリックし、' +
        '"タイトルを入力してください" というエラーメッセージが表示されているか確認してください。' +
        '表示されていれば "error shown"、表示されていなければ "no error" と返してください。',
      llm,
      browser,
    }).run(10);
    const valAddFinal = (valAddResult.final_result() ?? "").toLowerCase();
    if (!valAddFinal.includes("error shown")) {
      fail("タスク追加のバリデーションエラーが表示されていません");
    }
    ok('バリデーションエラー確認: "タイトルを入力してください"');

    log("VALIDATION (edit/add)", `"${VALIDATION_TASK_TITLE}" を追加する`);
    const valEditAddResult = await makeAgent({
      task:
        `"Add a new task..." の入力欄に "${VALIDATION_TASK_TITLE}" と入力し、` +
        '"Add" ボタンをクリックしてください。' +
        '一覧に表示されていれば "added"、表示されていなければ "not added" と返してください。',
      llm,
      browser,
    }).run(10);
    const valEditAddFinal = (valEditAddResult.final_result() ?? "").toLowerCase();
    if (valEditAddFinal.includes("not added") || !valEditAddFinal.includes("added")) {
      fail(`"${VALIDATION_TASK_TITLE}" を追加できませんでした`);
    }
    ok(`"${VALIDATION_TASK_TITLE}" を追加した`);

    log("VALIDATION (edit/error)", "タスク編集で空タイトルにするとエラーが出ることを確認する");
    const valEditErrorResult = await makeAgent({
      task:
        `"${VALIDATION_TASK_TITLE}" の編集ボタン（鉛筆アイコン）をクリックし、` +
        "入力欄のテキストをすべて消して空にし、保存ボタン（チェックアイコン）をクリックしてください。" +
        '"タイトルを入力してください" というエラーメッセージが表示されていれば "error shown"、' +
        '表示されていなければ "no error" と返してください。',
      llm,
      browser,
    }).run(15);
    const valEditErrorFinal = (valEditErrorResult.final_result() ?? "").toLowerCase();
    if (!valEditErrorFinal.includes("error shown")) {
      fail("タスク編集のバリデーションエラーが表示されていません");
    }
    ok('バリデーションエラー確認: "タイトルを入力してください"');

    log("VALIDATION (edit/cleanup)", "編集をキャンセルして検証用タスクを削除する");
    const valEditCleanupResult = await makeAgent({
      task:
        "編集モードのキャンセルボタン（×アイコン）をクリックし、" +
        `"${VALIDATION_TASK_TITLE}" の削除ボタン（ゴミ箱アイコン）をクリックしてください。` +
        `一覧から "${VALIDATION_TASK_TITLE}" が消えていれば "cleaned up"、` +
        '残っていれば "not cleaned up" と返してください。',
      llm,
      browser,
    }).run(10);
    const valEditCleanupFinal = (valEditCleanupResult.final_result() ?? "").toLowerCase();
    if (valEditCleanupFinal.includes("not cleaned up") || !valEditCleanupFinal.includes("cleaned up")) {
      fail(`"${VALIDATION_TASK_TITLE}" の後片付けができませんでした`);
    }
    ok(`"${VALIDATION_TASK_TITLE}" を削除した`);

    console.log("\n🎉 CRUD テスト完了！\n");
  } finally {
    await browser.kill();
  }
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(`\n${error.message}`);
  }
  process.exit(1);
});
