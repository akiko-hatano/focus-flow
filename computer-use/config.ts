/**
 * computer-use 共通設定
 *
 * Claude の Computer Use ツール（computer_20251124）を
 * @anthropic-ai/bedrock-sdk 経由で AWS Bedrock 上の Claude に接続し、
 * Playwright ブラウザに対してエージェントループを実行する。
 *
 * 環境変数:
 *   AWS_REGION
 *   AWS_BEDROCK_MODEL_ARN_ID  Bedrock 推論プロファイル ARN
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN
 */

import { chromium, type Browser, type Page } from "playwright";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import type Anthropic from "@anthropic-ai/sdk";

const DISPLAY_WIDTH = 1280;
const DISPLAY_HEIGHT = 800;
const BETA_HEADER = "computer-use-2025-11-24";
const TOOL_TYPE = "computer_20251124";

export function getClient(): { client: AnthropicBedrock; modelId: string } {
  const region = process.env.AWS_REGION;
  const modelId = process.env.AWS_BEDROCK_MODEL_ARN_ID;
  if (!region) throw new Error("環境変数 AWS_REGION が設定されていません");
  if (!modelId) throw new Error("環境変数 AWS_BEDROCK_MODEL_ARN_ID が設定されていません");

  // アクセスキーが未設定なら awsRegion のみ渡す（bedrock-sdk が AWS の
  // 標準クレデンシャルチェーン ＝ AWS_PROFILE や IAM ロールから自動で認証情報を解決する）
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const client =
    accessKey && secretKey
      ? new AnthropicBedrock({
          awsRegion: region,
          awsAccessKey: accessKey,
          awsSecretKey: secretKey,
          awsSessionToken: process.env.AWS_SESSION_TOKEN,
        })
      : new AnthropicBedrock({ awsRegion: region });
  return { client, modelId };
}

// RECORD_VIDEO_DIR を設定すると、実行内容を .webm 動画として保存する（PR 用デモ撮影向け）
export async function createBrowser(headless = false): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch({ headless });
  const videoDir = process.env.RECORD_VIDEO_DIR;
  const context = await browser.newContext({
    viewport: { width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT },
    ...(videoDir
      ? { recordVideo: { dir: videoDir, size: { width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT } } }
      : {}),
  });
  const page = await context.newPage();
  return { browser, page };
}

async function screenshotBase64(page: Page): Promise<string> {
  const buf = await page.screenshot({ type: "png" });
  return buf.toString("base64");
}

// Claude が返す key 表記（例: "ctrl+s", "Return", "alt+Tab"）を Playwright のキー表記に変換する
function mapKey(key: string): string {
  return key
    .split("+")
    .map((part) => {
      const p = part.trim();
      const lower = p.toLowerCase();
      if (lower === "super" || lower === "cmd") return "Meta";
      if (lower === "ctrl" || lower === "control") return "Control";
      if (lower === "return" || lower === "enter") return "Enter";
      if (lower === "esc") return "Escape";
      if (lower.length === 1) return p;
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    })
    .join("+");
}

// Claude が返す tool_use の action を実際の Playwright 操作に変換する。
// 座標は Claude に渡したスクリーンショットの座標系（= DISPLAY_WIDTH/HEIGHT、
// createBrowser のビューポートと同じ値）でそのまま返ってくるため、
// スケール変換なしに page.mouse に渡してよい。
//
// エラーは throw せず isError: true で返す。runAgentTask はこれを
// tool_result の is_error として Claude に返すことで、ループ全体を落とさずに
// Claude 自身に「操作が失敗した」ことを伝えて次の判断をさせられる。
async function executeAction(
  page: Page,
  action: string,
  input: Record<string, unknown>,
): Promise<{ text?: string; isError?: boolean }> {
  const coord = input.coordinate as [number, number] | undefined;
  // left_click 等では Shift/Ctrl 等の修飾キーが coordinate と同じ input.text に入って返ってくる
  // （type/key アクションの「入力するテキスト」とは別の意味で text フィールドが再利用されている）
  const modifierKey = input.text ? mapKey(input.text as string) : undefined;

  switch (action) {
    case "screenshot":
      return {};
    case "left_click":
      if (!coord) return { text: "coordinate is required", isError: true };
      if (modifierKey) await page.keyboard.down(modifierKey);
      await page.mouse.click(coord[0], coord[1]);
      if (modifierKey) await page.keyboard.up(modifierKey);
      return { text: `clicked at (${coord[0]}, ${coord[1]})` };
    case "double_click":
      if (!coord) return { text: "coordinate is required", isError: true };
      await page.mouse.click(coord[0], coord[1], { clickCount: 2 });
      return { text: `double-clicked at (${coord[0]}, ${coord[1]})` };
    case "triple_click":
      if (!coord) return { text: "coordinate is required", isError: true };
      await page.mouse.click(coord[0], coord[1], { clickCount: 3 });
      return { text: `triple-clicked at (${coord[0]}, ${coord[1]})` };
    case "right_click":
      if (!coord) return { text: "coordinate is required", isError: true };
      await page.mouse.click(coord[0], coord[1], { button: "right" });
      return { text: `right-clicked at (${coord[0]}, ${coord[1]})` };
    case "middle_click":
      if (!coord) return { text: "coordinate is required", isError: true };
      await page.mouse.click(coord[0], coord[1], { button: "middle" });
      return { text: `middle-clicked at (${coord[0]}, ${coord[1]})` };
    case "mouse_move":
      if (!coord) return { text: "coordinate is required", isError: true };
      await page.mouse.move(coord[0], coord[1]);
      return { text: `moved to (${coord[0]}, ${coord[1]})` };
    case "left_click_drag": {
      const start = input.start_coordinate as [number, number] | undefined;
      if (!start || !coord) return { text: "start_coordinate/coordinate is required", isError: true };
      await page.mouse.move(start[0], start[1]);
      await page.mouse.down();
      await page.mouse.move(coord[0], coord[1]);
      await page.mouse.up();
      return { text: `dragged from (${start[0]}, ${start[1]}) to (${coord[0]}, ${coord[1]})` };
    }
    case "left_mouse_down":
      if (coord) await page.mouse.move(coord[0], coord[1]);
      await page.mouse.down();
      return { text: "mouse down" };
    case "left_mouse_up":
      await page.mouse.up();
      return { text: "mouse up" };
    case "type": {
      if (typeof input.text !== "string") return { text: "text is required", isError: true };
      await page.keyboard.type(input.text);
      return { text: `typed: ${input.text}` };
    }
    case "key": {
      if (typeof input.text !== "string") return { text: "text is required", isError: true };
      await page.keyboard.press(mapKey(input.text));
      return { text: `pressed: ${input.text}` };
    }
    case "hold_key": {
      if (typeof input.text !== "string") return { text: "text is required", isError: true };
      const k = mapKey(input.text);
      const duration = (input.duration as number) ?? 1;
      await page.keyboard.down(k);
      await new Promise((r) => setTimeout(r, duration * 1000));
      await page.keyboard.up(k);
      return { text: `held ${input.text} for ${duration}s` };
    }
    case "scroll": {
      const dir = input.scroll_direction as string;
      const amount = ((input.scroll_amount as number) ?? 3) * 100;
      const deltaMap: Record<string, [number, number]> = {
        up: [0, -amount],
        down: [0, amount],
        left: [-amount, 0],
        right: [amount, 0],
      };
      const delta = deltaMap[dir];
      if (!delta) return { text: `invalid scroll_direction: ${dir}`, isError: true };
      if (coord) await page.mouse.move(coord[0], coord[1]);
      await page.mouse.wheel(delta[0], delta[1]);
      return { text: `scrolled ${dir} by ${amount}` };
    }
    case "wait": {
      const duration = (input.duration as number) ?? 1;
      await new Promise((r) => setTimeout(r, duration * 1000));
      return { text: `waited ${duration}s` };
    }
    default:
      return { text: `unsupported action: ${action}`, isError: true };
  }
}

/**
 * Computer Use の agent loop 本体。
 *
 * Computer Use はライブラリではなく Claude 自身の機能で、Claude は
 * 「この座標をクリックして」等の tool_use を返すだけで実際の操作はしない。
 * そのため呼び出し側が「Claude の指示を実行 → 結果（新しいスクリーンショット）を
 * 返す → 次の指示を受け取る」というループを自分で回す必要がある。
 * このループは stop_reason が tool_use でなくなった（= Claude がテキストのみで
 * 応答した）時点で完了とみなして終了する。
 *
 * maxIterations は、Claude が完了判断を誤って無限にツールを呼び続けるのを防ぐ
 * セーフガード（無限ループ・想定外の API コスト増を回避するため）。
 */
export async function runAgentTask(
  page: Page,
  task: string,
  maxIterations = 15,
): Promise<string> {
  const { client, modelId } = getClient();
  // computer_20251124 はスキーマレスツール（Claude 側に組み込み済みのため
  // 入力スキーマを自分で定義する必要がない）。bedrock-sdk の型定義がまだ
  // このツール形状を正式にサポートしていないため as unknown で回避している。
  const tools = [
    {
      type: TOOL_TYPE,
      name: "computer",
      display_width_px: DISPLAY_WIDTH,
      display_height_px: DISPLAY_HEIGHT,
    },
  ] as unknown as Anthropic.Beta.Messages.BetaToolUnion[];

  // 最初のメッセージは「タスク文＋現在の画面」。指示（テキスト）を画像より前に
  // 置くと要素特定の精度が上がるとされている（公式ドキュメントのプロンプト最適化 Tips）。
  const initialShot = await screenshotBase64(page);
  let messages: Anthropic.Beta.Messages.BetaMessageParam[] = [
    {
      role: "user",
      content: [
        { type: "text", text: task },
        { type: "image", source: { type: "base64", media_type: "image/png", data: initialShot } },
      ],
    },
  ];

  for (let i = 0; i < maxIterations; i++) {
    const response = await client.beta.messages.create({
      model: modelId,
      max_tokens: 4096,
      messages,
      tools,
      betas: [BETA_HEADER],
    });

    // 会話履歴に Claude の応答（tool_use ブロックを含む）を積んでおく必要がある。
    // 次のリクエストで tool_result を返すとき、対応する tool_use が履歴に
    // 存在しないと API がエラーになる。
    messages.push({ role: "assistant", content: response.content });

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.Beta.Messages.BetaToolUseBlock => b.type === "tool_use",
    );
    if (toolUseBlocks.length === 0) {
      // tool_use が無い = Claude がタスク完了と判断してテキストのみで応答した
      const finalText = response.content
        .filter((b): b is Anthropic.Beta.Messages.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return finalText;
    }

    const toolResults: Anthropic.Beta.Messages.BetaToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const input = block.input as Record<string, unknown>;
      const action = input.action as string;
      const { text, isError } = await executeAction(page, action, input);
      // アクション実行後の画面を毎回撮り直して返す。Claude は前回の指示が
      // 実際に反映されたかをこの新しいスクリーンショットで確認してから次の指示を出す。
      const shot = await screenshotBase64(page);
      const content: Anthropic.Beta.Messages.BetaToolResultBlockParam["content"] = [
        ...(text ? [{ type: "text" as const, text }] : []),
        { type: "image" as const, source: { type: "base64" as const, media_type: "image/png" as const, data: shot } },
      ];
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content,
        is_error: isError,
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  throw new Error(`タスクが ${maxIterations} 回のイテレーションで完了しませんでした`);
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
