import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

const region = process.env.AWS_REGION;
const modelIdEnv = process.env.AWS_BEDROCK_MODEL_ARN_ID;
if (!region) throw new Error("環境変数 AWS_REGION が設定されていません");
if (!modelIdEnv) throw new Error("環境変数 AWS_BEDROCK_MODEL_ARN_ID が設定されていません");

const bedrockConfig: Record<string, string> = { region };
if (process.env.AWS_ACCESS_KEY_ID) bedrockConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
if (process.env.AWS_SECRET_ACCESS_KEY) bedrockConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
if (process.env.AWS_SESSION_TOKEN) bedrockConfig.sessionToken = process.env.AWS_SESSION_TOKEN;

export const bedrock = createAmazonBedrock(bedrockConfig);
export const modelId = modelIdEnv;

export function log(step: string, message: string) {
  console.log(`\n📌 [${step}] ${message}`);
}
export function ok(message: string) { console.log(`   ✅ ${message}`); }
export function fail(message: string): never {
  throw new Error(`❌ ${message}`);
}
