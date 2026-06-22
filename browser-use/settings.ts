/**
 * focus-flow の Settings テスト (browser-use)
 *
 * 実行方法:
 *   pnpm browser-use:settings
 */

import { fail, getLlm, log, makeAgent, makeBrowser, ok } from "./config";

const APP_URL = "http://localhost:3000/settings";

async function main(): Promise<void> {
  const { llm, modelId } = getLlm();
  console.log(`\n🤖 モデル: ${modelId}`);
  console.log(`🌐 テスト対象: ${APP_URL}\n`);

  const browser = makeBrowser();

  try {
    log("READ", "現在のテーマを確認する");
    const readResult = await makeAgent({
      task:
        `${APP_URL} を開いて、` +
        "「選択中:」と書かれたテキストの後に続くテーマ名を教えてください。" +
        'テーマ名だけを返してください（例: "Blue"）。',
      llm,
      browser,
    }).run(5);
    const currentTheme = (readResult.final_result() ?? "").trim().replace(/^"|"$/g, "");
    if (!currentTheme) {
      fail("現在のテーマを取得できませんでした");
    }
    ok(`現在のテーマ: "${currentTheme}"`);

    log("UPDATE", "別のテーマに切り替える");
    const switchResult = await makeAgent({
      task:
        `現在のテーマは "${currentTheme}" です。` +
        `"${currentTheme}" 以外のテーマカラーボタン（色のついた丸いボタン）をひとつクリックしてください。` +
        `クリック後、「選択中:」の後に続くテーマ名が "${currentTheme}" から変わっていれば ` +
        '"changed to <新テーマ名>" と返してください。' +
        '変わっていなければ "not changed" と返してください。',
      llm,
      browser,
    }).run(10);
    const switchFinal = (switchResult.final_result() ?? "").toLowerCase();
    if (switchFinal.includes("not changed")) {
      fail("テーマが変わっていません");
    }
    ok(`テーマ変更成功: "${currentTheme}" → ${switchResult.final_result()}`);

    console.log("\n🎉 Settings テスト完了！\n");
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
