# Stagehand

## 概要

Stagehand は [Browserbase](https://browserbase.com) が開発した OSS のブラウザ自動化ライブラリです。
Playwright をベースに、OpenAI や Anthropic などの外部 LLM API を組み合わせることで、CSS セレクタや XPath を細かく書かなくても自然言語だけでブラウザを操作できるのが特徴です。
動作には利用者自身の LLM API キーやアクセス権（OpenAI・Anthropic・Gemini・AWS Bedrock など）の設定が必要です。

## 導入方法

- [Quickstart - Stagehand](https://docs.stagehand.dev/v3/first-steps/quickstart)

必要なパッケージをインストールします。


| パッケージ                      | バージョン         | 用途                                   |
| -------------------------- | ------------- | ------------------------------------ |
| `@browserbasehq/stagehand` | 3.5.0         | 本体                                   |
| `@ai-sdk/amazon-bedrock`   | 3.x（v4 系は非互換） | AWS Bedrock 接続用（LLM に Bedrock を使う場合） |
| `playwright`               | 1.60.0        | ブラウザ操作の実行エンジン（devDependencies）       |
| `tsx`                      | 4.22.4        | TypeScript スクリプトの実行用                 |


※ 上記以外に、LLM の API キーやアクセス権が別途必要

## 出自・背景

Browserbase（Stagehand の開発元）が開発・メンテナンスしています。
"AI Agent にブラウザを扱わせる" ユースケースの急増を背景に、2024年末に公開され、今も急速に進化しています。
開発元が提供するクラウドブラウザ環境（大規模実行やボット検知による誤ブロックの防止）とスムーズに連携できる設計になっており、ローカル環境（Playwright ベース）での完全無料実行もサポートしています。

## 主な機能

- [Act - Stagehand](https://docs.stagehand.dev/v3/basics/act)
- [Extract - Stagehand](https://docs.stagehand.dev/v3/basics/extract)
- [Observe - Stagehand](https://docs.stagehand.dev/v3/basics/observe)
- [Agent - Stagehand](https://docs.stagehand.dev/v3/basics/agent)

| API（v3 以降推奨）                             | 役割             | 実装例              |
| ---------------------------------------- | -------------- | ---------------- |
| `stagehand.act(instruction)`             | 自然言語でブラウザ操作    | `'「追加」ボタンをクリック'` |
| `stagehand.extract(instruction, schema)` | Zod スキーマでデータ抽出 | `'タスク一覧を取得'`     |
| `stagehand.observe(instruction)`         | 操作可能な要素を検出して返す | `'入力フィールドを探す'`   |


※ Playwright 本来の低レイヤーな操作が必要な場合は、`stagehand.context.activePage()` で Page オブジェクトを取得できます。

## 基本的な使い方

- [Quickstart - Stagehand](https://docs.stagehand.dev/v3/first-steps/quickstart)

### 初期化（AWS Bedrock を使う場合）

```ts
import { Stagehand } from "@browserbasehq/stagehand";
import { AISdkClient } from "@browserbasehq/stagehand/dist/lib/ai_sdk_client";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

const bedrock = createAmazonBedrock({ region: "us-east-1" });
const stagehand = new Stagehand({
  env: "LOCAL",
  modelName: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  modelClientOptions: { apiKey: "placeholder" },
  llmClient: new AISdkClient({
    model: bedrock("anthropic.claude-3-5-sonnet-20241022-v2:0"),
  }),
});
await stagehand.init();
```

### act — 自然言語でブラウザ操作

```ts
await stagehand.act({ action: "「追加」ボタンをクリックする" });
```

### extract — Zod スキーマでデータ抽出

```ts
import { z } from "zod";

const result = await stagehand.extract({
  instruction: "タスクの一覧を取得する",
  schema: z.object({
    tasks: z.array(z.object({ title: z.string(), done: z.boolean() })),
  }),
});
```

### observe — 操作可能な要素を検出

```ts
const elements = await stagehand.observe({
  instruction: "クリックできるボタンを探す",
});
```

## 特徴

従来のスクレイピングツール（Playwright, Puppeteer, Selenium など）が「HTML の構造（DOM）」に依存していたのに対し、Stagehand は **「AI による画面の視覚的・構造的理解」** に依存しています。人間の指示文から操作対象のボタンや入力欄を AI が自律的に判断して動きます。

## メリット or 強み

- **CSS セレクタ・XPath 不要**: 面倒な要素特定の作業がなくなり、自然言語だけで操作を記述できます。
- **UI 変更に強い**: 画面デザインや HTML 構造が多少変わっても、AI が目的のボタンや入力欄を見つけ直すためテストが壊れにくいです。
- **Zod スキーマによる型安全な抽出**: Zod で定義した型通りのオブジェクトとして、パースされたデータを確実に受け取れます。
- **Playwright コードとの混在**: 「ログイン処理は確実な Playwright コードで、ページ内の探索やデータ抽出は AI に任せる」といった柔軟な運用が可能です。
- **キャッシュ機能（Deterministic Playback）**: 2回目以降の同じ操作時、LLM 呼び出しをスキップ（過去のセレクタを再利用）するため、コストと処理時間を大幅に削減できます。
- **ローカル完結が可能**: 開発元の有料クラウドを使わなくても、手元のローカル環境のみで完全に動作します。

## デメリット or 弱み

- **実行速度のボトルネック**: アクションごとに LLM 呼び出しが発生するため、1テスト（1画面遷移）あたり数十秒かかります。
- **LLM 従量課金コスト**: 実行のたびに Claude や GPT-4o などの API トークンコストが発生します。
- **単純すぎるページでの課題**: `observe()` は、要素が極端に少ないシンプルなページだと、AI が「操作可能対象」と認識できず候補が 0 件になることがあります。
- **プロンプトの制約**: `act()` の指示文は純粋な自然言語で書く必要があり、CSS セレクタを混ぜると AI が誤動作しやすくなります。
- **認証運用の手間**: AWS Bedrock を利用する場合、一時クレデンシャルの管理に固有の考慮が必要です（詳細は「導入する場合の懸念点」を参照）。

## 学習コスト

**低めです。**
覚えるべきコア API は `act` / `extract` / `observe` の 3 つだけなので、Playwright の深い知識がなくても直感的に動かせます。
ただし、AWS Bedrock 接続まわり（`AISdkClient` のラップ方法や一時クレデンシャルの挙動）には固有のハマりどころがあるため、環境構築時の初期コストはやや発生します。

## 導入する場合の懸念点

- **LLM 認証情報の管理**: 利用する LLM サービスの認証情報（API キー・一時クレデンシャルなど）を環境変数で管理する必要があります。CI に組み込む場合は、シークレット管理の仕組みを別途整備することが前提になります。
- **実行速度・コスト**: LLM 呼び出しが 1 アクションごとに発生するため、テスト数が増えると時間・コストが線形に増加します。Unit テストとは用途を明確に分け、トリガーを絞って運用するのが望ましいです。
- **dev サーバーとの相性**: ナビゲーション時の待機設定はフレームワークの通信特性によって調整が必要な場合があります（例：`waitUntil: "networkidle"` はタイムアウトしやすいため `"domcontentloaded"` が安定しやすい）。

## 実際の使用例

focus-flow プロジェクトでの検証結果は以下の PR を参照してください。

→ [akiko-hatano/focus-flow #1 — feat: Stagehand による E2E テスト実装（技術調査）](https://github.com/akiko-hatano/focus-flow/pull/1)



## 類似ツール比較


| 項目            | Stagehand          | Playwright（純粋） | Cypress     |
| ------------- | ------------------ | -------------- | ----------- |
| **操作記述**      | 自然言語（AI）           | コード（セレクタ）      | コード（セレクタ）   |
| **実行速度**      | 遅い（LLM 呼び出し）       | 高速             | 高速          |
| **UI 変更耐性**   | **高い（壊れにくい）**      | 低い（すぐ壊れる）      | 低い（すぐ壊れる）   |
| **LLM コスト**   | あり（従量課金）           | なし             | なし          |
| **セットアップ難易度** | 中（LLM 認証まわり）       | 低              | 低           |
| **CI 対応**     | △（OIDC / IAM ロール要） | ○              | ○           |
| **型安全なデータ抽出** | **○（Zod 標準対応）**    | △（手動パースが必要）    | △（手動パースが必要） |


## メンテナンス状況

開発元の Browserbase 社のコアチームおよびオープンソースコミュニティによって積極的にメンテナンスされています。v3.5.0 を経て現在も継続的にアップデートが続いており、GitHub のコミット履歴やリリースの頻度は高いです。バグ修正だけでなく、TypeScript 以外の多言語対応（Python 拡張等）への開発も活発に行われています。

## 普及度・トレンド感

GitHub Stars は **23,000 以上**。"AI browser automation" の文脈で多く言及されており、2025年の技術記事に頻出しています。国内外の技術ブログ（Qiita, Zenn 等）でも比較的新しい検証記事が頻繁に投稿されており、AI Agent 関連の OSS の中では認知度が高まっています。

## ライセンス

**MIT ライセンス**（商用利用・改変・配布が自由に可能で、企業導入しやすいライセンスです）。

## 料金体系

- **OSS 本体 / ローカル実行**: **無料**（MIT ライセンス）。手元の Playwright エンジンで動かす分にはライセンス費用は不要です。
- **LLM 利用料**: OpenAI や Anthropic などの外部 API を呼び出すため、各モデルのトークン消費に応じた従量課金コストが別途発生します。
- **Browserbase クラウドサービス（任意）**: 大規模な並列実行や、プロキシ、高度なボット検知・誤ブロック回避環境をクラウド上で利用したい場合のみ、有料のプラン契約を選択できます。ローカル運用であれば契約不要です。

## 向いているケース

- UI やデザインが頻繁に変更されるプロダクトの E2E テスト
- セレクタの特定や動的ポップアップ等のハンドリングが難しい複雑な操作フロー
- サイトの内部構造に依存しない安定したスクレイピング・データ抽出の自動化
- AI エージェントに実際のブラウザ操作を自律的に委譲したいとき
- テストコードのメンテナンスコスト（デザイン微修正によるテスト落ち）を最小限に抑えたいとき

## 向いていないケース

- 高速なフィードバックサイクルが必要な毎コミット時の CI
- テスト実行にかかる LLM API のランニングコストを完全にゼロに抑えたいプロジェクト
- 大量のテストケースを並列実行して即座に合否結果を返したい場合
- ネットワークから隔離された完全なオフライン環境（外部 LLM API への接続が必須なため）
- ピクセルレベルでの厳密なレイアウト崩れを検知する視覚的回帰テスト（Visual Regression Testing）

## 総評

「セレクタを書かずに E2E テストを記述したい」「UI の変更に強いテストを作りたい」というニーズには非常に強力に刺さるツールです。

一方で、実行速度・LLM コスト・認証管理の手間は明確なトレードオフになります。高速な CI パイプラインとは共存しにくいため、**「重要フローの定期実行テスト」や「スクレイピング自動化」の用途に絞って導入するのが現実的です**。

CI/CD に組み込む場合は、OIDC + IAM ロールによる AWS 認証管理（Bedrock 利用時）のインフラ整備を前提として進めるのが推奨されます。

## 参考リンク

- [GitHub — browserbase/stagehand](https://github.com/browserbase/stagehand)
- [Stagehand 公式ドキュメント](https://docs.stagehand.dev)
- [Browserbase（クラウドサービス）](https://browserbase.com)
- [Vercel AI SDK（@ai-sdk/amazon-bedrock）](https://sdk.vercel.ai/docs/introduction)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)

## 備考

- **`@ai-sdk/amazon-bedrock` のバージョン固定について**: v4 系は Stagehand の `AISdkClient` と破壊的非互換があるため、`3.x` への固定が必要です（`package.json` に `"@ai-sdk/amazon-bedrock": "3.x"` と明記推奨）。
- **キャッシュファイルの管理**: Deterministic Playback のキャッシュは `.stagehand-cache/` ディレクトリに保存されます。環境差異によるキャッシュ汚染を防ぐため、`.gitignore` への追加を推奨します。

