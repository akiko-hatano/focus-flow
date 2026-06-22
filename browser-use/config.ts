import { Agent, BrowserSession } from "browser-use";
import { ChatBedrockConverse } from "browser-use/llm/aws";

/**
 * browser-use 共通設定
 *
 * 環境変数:
 *   AWS_BEDROCK_MODEL_ARN_ID  各メンバーに割り当てられた推論プロファイル ARN
 *   AWS_REGION
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN
 */

const EXTEND_SYSTEM_MESSAGE =
  "Evaluation、Memory、Next Goal は日本語で記述してください。" +
  "最終結果（final result）はタスク内で指定したキーワードをそのまま英語で返してください。";

export function getLlm(): { llm: ChatBedrockConverse; modelId: string } {
  const region = process.env.AWS_REGION;
  const modelId = process.env.AWS_BEDROCK_MODEL_ARN_ID;

  if (!region) throw new Error("環境変数 AWS_REGION が設定されていません");
  if (!modelId) throw new Error("環境変数 AWS_BEDROCK_MODEL_ARN_ID が設定されていません");

  const llm = new ChatBedrockConverse({
    model: modelId,
    region,
    ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
          awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          ...(process.env.AWS_SESSION_TOKEN
            ? { awsSessionToken: process.env.AWS_SESSION_TOKEN }
            : {}),
        }
      : {}),
  });

  return { llm, modelId };
}

export function makeBrowser(headless = false): BrowserSession {
  return new BrowserSession({
    profile: { headless, keep_alive: true },
  });
}

export function makeAgent({
  task,
  llm,
  browser,
}: {
  task: string;
  llm: ChatBedrockConverse;
  browser: BrowserSession;
}): Agent {
  return new Agent({
    task,
    llm,
    browser,
    extend_system_message: EXTEND_SYSTEM_MESSAGE,
  });
}

export function log(step: string, message: string): void {
  console.log(`\n📌 [${step}] ${message}`);
}

export function ok(message: string): void {
  console.log(`  ✅ ${message}`);
}

export function fail(message: string): never {
  throw new Error(`❌ ${message}`);
}
