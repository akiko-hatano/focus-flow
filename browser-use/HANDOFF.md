# browser-use E2E テスト — 引き継ぎメモ

**プロジェクト**: `~/git/focus-flow`  
**ブランチ**: `feature/browser-use`（未コミット）  
**目的**: PR #1（Stagehand E2E）と同等のテストを browser-use で実装し、技術調査として比較可能にする

---

## 現在の状態

### 完了していること

- **Python → TypeScript 移行済み**（Next.js プロジェクトに合わせ Stagehand と同じ `tsx` 実行方式）
- **3 本の E2E テスト**を実装・動作確認済み
  - `browser-use/todo-crud.ts` — TODO CRUD + バリデーション ✅
  - `browser-use/profile.ts` — プロフィール更新・バリデーション・Cancel ✅
  - `browser-use/settings.ts` — テーマ切り替え（未確認）
- **共通設定** `browser-use/config.ts`
  - Bedrock LLM（`ChatBedrockConverse`）
  - `makeAgent` / `makeBrowser`（`keep_alive: true`、日本語 system message）
- **`pnpm install` だけで Chromium まで自動インストール**（`postinstall` スクリプト）
- **`browser-use` を devDependencies に移動**
- **`ANONYMIZED_TELEMETRY=false`** を `.env.local` に追加（PostHog エラー対策）
- **Python 残骸（`__pycache__`）削除済み**

### 未コミットの変更

```
M  package.json        # postinstall 追加、browser-use を devDependencies に移動
M  pnpm-lock.yaml
M  pnpm-workspace.yaml
M  .env.local          # ANONYMIZED_TELEMETRY=false 追加
?? browser-use/        # TS テスト一式
?? stagehand/          # stagehand-summary.md のみ（調査ドキュメント）
```

---

## ディレクトリ構成

```
browser-use/
├── config.ts       # LLM・Agent・Browser 共通設定
├── todo-crud.ts    # TODO CRUD + バリデーション
├── profile.ts      # プロフィール画面
├── settings.ts     # 設定画面
└── HANDOFF.md      # 本ファイル
```

---

## セットアップ（メンバー各自）

### 1. 依存関係

```bash
pnpm install   # Playwright Chromium も postinstall で自動インストール
```

### 2. `.env.local`（git 管理外・各自作成）

```env
AWS_PROFILE=tvai-claude
AWS_REGION=ap-northeast-1
AWS_BEDROCK_MODEL_ARN_ID=arn:aws:bedrock:...:application-inference-profile/xxxx
# ↑ 各メンバーに割り当てられた ARN を各自が設定

ANONYMIZED_TELEMETRY=false

# SSO 一時クレデンシャル（期限切れたら更新）
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...
```

**再認証手順**（トークン期限切れ時）:

```bash
aws sso login --profile tvai-claude
aws configure export-credentials --profile tvai-claude --format env
# → 出力を .env.local に貼り替え
```

**注意**: `AWS_SESSION_TOKEN` は **クォートなし・1行** で書く（パースエラーの原因になった）

### 3. 実行

```bash
pnpm dev                    # 別ターミナルで http://localhost:3000
pnpm browser-use:todo
pnpm browser-use:profile
pnpm browser-use:settings
```

---

## 技術選定メモ

| 項目 | 内容 |
|------|------|
| ライブラリ | npm [`browser-use`](https://www.npmjs.com/package/browser-use) v0.7.3（Python OSS の **TypeScript ポート**、ローカル実行） |
| LLM | `ChatBedrockConverse`（`browser-use/llm/aws`）— AIP の ARN をそのまま `model` に渡す |
| 実行 | `tsx --env-file .env.local`（Stagehand ブランチと同パターン） |
| Cloud SDK | **使っていない**（`browser-use-sdk` は Cloud 用で別物） |

### Python 版から TS 版への経緯（ハマりどころ）

1. **langchain-aws `ChatBedrockConverse`** → browser-use 標準 LLM と非互換（`.model` 属性なしで落ちた）  
   → **`browser-use/llm/aws` の `ChatBedrockConverse`** に統一

2. **`GetInferenceProfile` 権限不足**（langchain-aws 初期化時）  
   → TS 版は Bedrock Runtime `converse` を直接呼ぶため **不要**（`AWS_BEDROCK_BASE_MODEL_ID` も不要）

3. **複数 Agent 間でブラウザが切れる**  
   → `makeBrowser()` で `keep_alive: true`

4. **READ タスク内の `（http://localhost:3000）` が誤 URL 検出**  
   → タスク文から URL を除去

5. **VALIDATION (edit) が 1 Agent に詰め込みすぎ → Judge Fail（後片付け未完了）**  
   → **3 Agent に分割**（add / error 確認 / cleanup）

6. **Eval ログが英語**  
   → `extend_system_message` で日本語化（`INFO [Agent]` 等のフレームワークログは英語のまま）

---

## 設計上の重要な決定事項

### `keep_alive: true` + `browser.kill()`
各ステップを別エージェントに分割しているため、ブラウザセッションをステップ間で共有する必要がある。
`keep_alive: true` にすると `close()` では終了しないため、最後に `kill()` で強制終了している。

### `is_successful()` を使わない
browser-use の Simple Judge が「証拠がない」として誤 FAIL することがある。
返り値の文字列だけで判定する方針に統一した。

### バリデーション確認は積極的チェック
`"no error" を含む → FAIL` ではなく `"error shown" を含まない → FAIL` に変更。
エージェントが予期外の文字列を返した場合でも誤検知しないようにするため。

### メール不正値は `test@test`
`not-an-email` だとブラウザの HTML5 ネイティブバリデーションが先に発火して Zod のエラーが表示されない。
`test@test`（`@` はあるが TLD なし）はブラウザを通過し、Zod が弾く。
アプリ側（`ProfileForm.tsx`）は変更していない（技術比較の公平性のため）。

### UPDATE 確認は「エラーなし」で判定（profile.ts）
"Updated!" ボタンは 2 秒で消えるためスクリーンショットのタイミングが合わずループする。
「クリック後にエラーメッセージが表示されていないこと」で保存成功を確認している。

---

## テスト内容概要

### todo-crud.ts

1. CREATE → READ → UPDATE(complete) → UPDATE(edit) → DELETE
2. VALIDATION(add): 空タイトルでエラー
3. VALIDATION(edit): 3 ステップに分割
   - add `Validation test task`
   - 編集 → 空 → 保存 → エラー確認
   - キャンセル → 削除

### profile.ts

更新保存 → 名前バリデーション → メールバリデーション → Cancel リセット

### settings.ts

現在テーマ取得 → 別テーマに切り替え

---

## 既知の制約・期待値

- **1 シナリオ数分〜十数分**かかる（LLM 呼び出しがステップごとに発生）
- **Judge**（browser-use 内部の採点 LLM）が Fail しても、Agent 自身が success と言えば **スクリプトは通る**（現状 Judge は見ていない）
- **毎コミット CI 向きではない**（Stagehand 調査と同じトレードオフ）
- **初回実行**は拡張機能ダウンロードで少し時間がかかる

---

## 残課題

- [ ] `browser-use:settings` テストの動作確認（未実施）
- [ ] **git commit** → PR 作成（`feature/browser-use` → `main`）
- [ ] Stagehand との比較ドキュメント整備（`stagehand/stagehand-summary.md` に browser-use 節を追加する等）

---

## 参考

- Stagehand 実装: `feature/stagehand` ブランチ（[PR #1](https://github.com/akiko-hatano/focus-flow/pull/1)）
- Stagehand 調査メモ: `stagehand/stagehand-summary.md`
- browser-use TS 版: https://github.com/webllm/browser-use
