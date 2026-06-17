import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

const bedrockConfig: Record<string, string> = {
  region: process.env.AWS_REGION!,
};
if (process.env.AWS_ACCESS_KEY_ID) bedrockConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
if (process.env.AWS_SECRET_ACCESS_KEY) bedrockConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
if (process.env.AWS_SESSION_TOKEN) bedrockConfig.sessionToken = process.env.AWS_SESSION_TOKEN;

export const bedrock = createAmazonBedrock(bedrockConfig);
export const modelId = process.env.AWS_BEDROCK_MODEL_ARN_ID!;

export function log(step: string, message: string) {
  console.log(`\n📌 [${step}] ${message}`);
}
export function ok(message: string) { console.log(`   ✅ ${message}`); }
export function fail(message: string) { console.error(`   ❌ ${message}`); process.exit(1); }
