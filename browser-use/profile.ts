/**
 * focus-flow の Profile テスト (browser-use)
 *
 * 実行方法:
 *   pnpm browser-use:profile
 */

import { fail, getLlm, log, makeAgent, makeBrowser, ok } from "./config";

const APP_URL = "http://localhost:3000/profile";

async function main(): Promise<void> {
  const { llm, modelId } = getLlm();
  console.log(`\n🤖 モデル: ${modelId}`);
  console.log(`🌐 テスト対象: ${APP_URL}\n`);

  const browser = makeBrowser();

  try {
    log("UPDATE", "名前とメールアドレスを更新して保存する");
    const updateResult = await makeAgent({
      task:
        `${APP_URL} を開いて、` +
        '"Full Name" の入力欄のテキストをすべて消して "Test User" と入力し、' +
        '"Email Address" の入力欄のテキストをすべて消して "test@example.com" と入力し、' +
        '"Save Changes" ボタンをクリックしてください。' +
        'クリック後にエラーメッセージが表示されていなければ "saved"、' +
        'エラーメッセージが表示されていれば "not saved" と返してください。',
      llm,
      browser,
    }).run(15);
    const updateFinal = (updateResult.final_result() ?? "").toLowerCase();
    if (updateFinal.includes("not saved")) {
      fail(`保存が確認できません: ${updateResult.final_result()}`);
    }
    ok('保存成功: "Updated!"');

    log("VALIDATION (name)", "名前を空にすると「名前を入力してください」が出ることを確認する");
    const nameResult = await makeAgent({
      task:
        '"Full Name" の入力欄のテキストをすべて消して空にし、' +
        '"Save Changes" ボタンをクリックしてください。' +
        '"名前を入力してください" というエラーメッセージが表示されていれば "error shown"、' +
        '表示されていなければ "no error" と返してください。',
      llm,
      browser,
    }).run(10);
    const nameFinal = (nameResult.final_result() ?? "").toLowerCase();
    if (!nameFinal.includes("error shown")) {
      fail('"名前を入力してください" が表示されていません');
    }
    ok('バリデーションエラー確認: "名前を入力してください"');

    log(
      "VALIDATION (email)",
      "不正なメールアドレスで「有効なメールアドレスを入力してください」が出ることを確認する",
    );
    const emailResult = await makeAgent({
      task:
        '"Full Name" の入力欄に "Test User" と入力し、' +
        '"Email Address" の入力欄のテキストをすべて消して "test@test" と入力し、' +
        '"Save Changes" ボタンをクリックしてください。' +
        '"有効なメールアドレスを入力してください" というエラーメッセージが表示されていれば "error shown"、' +
        '表示されていなければ "no error" と返してください。',
      llm,
      browser,
    }).run(10);
    const emailFinal = (emailResult.final_result() ?? "").toLowerCase();
    if (!emailFinal.includes("error shown")) {
      fail('"有効なメールアドレスを入力してください" が表示されていません');
    }
    ok('バリデーションエラー確認: "有効なメールアドレスを入力してください"');

    log("CANCEL", "Cancel ボタンで変更をリセットする");
    const cancelResult = await makeAgent({
      task:
        '"Full Name" の入力欄のテキストをすべて消して "Changed Name" と入力し、' +
        '"Cancel" ボタンをクリックしてください。' +
        '"Full Name" の入力欄が "Changed Name" 以外の値に戻っていれば "reset"、' +
        '"Changed Name" のままであれば "not reset" と返してください。',
      llm,
      browser,
    }).run(10);
    const cancelFinal = (cancelResult.final_result() ?? "").toLowerCase();
    if (cancelFinal.includes("not reset")) {
      fail(`Cancel が効いていません: ${cancelResult.final_result()}`);
    }
    ok("Cancel でリセット成功");

    console.log("\n🎉 Profile テスト完了！\n");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n${error.message}`);
    }
    process.exit(1);
  } finally {
    await browser.kill();
  }
}

main();
