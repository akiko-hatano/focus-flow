# FocusFlow

Playwright MCP や browser use などの自動化ツール検証用の サンプル TODO アプリです。

## 技術スタック

- Next.js 16
- TypeScript
- Tailwind CSS 4
- Jotai
- Zod
- Vitest
- mise / pnpm

## セットアップ

```bash
mise install
pnpm install
pnpm dev
```

http://localhost:3000 でアプリを開けます。

## 画面

| パス | 画面 |
|------|------|
| `/` | TODO 管理（TOP） |
| `/profile` | ユーザー情報 |
| `/settings` | アプリ設定（テーマカラー） |

## スクリプト

```bash
pnpm dev          # 開発サーバー
pnpm build        # 本番ビルド
pnpm test         # テスト実行
pnpm lint         # Lint
```

## ディレクトリ構成

```
.
├── .mise.toml              # Node.js / pnpm のバージョン管理
├── package.json
├── vitest.config.ts
├── src/
│   ├── app/                # Next.js App Router（ページ・レイアウト）
│   │   ├── layout.tsx      # ルートレイアウト（JotaiProvider）
│   │   ├── globals.css     # Tailwind テーマ・デザイントークン
│   │   ├── page.tsx        # TODO 管理（TOP）
│   │   ├── profile/        # ユーザー情報画面
│   │   └── settings/       # アプリ設定画面
│   ├── components/
│   │   ├── layout/         # 共通シェル（ナビ・ヘッダー・テーマ適用）
│   │   ├── tasks/          # TODO 一覧・追加・編集 UI
│   │   ├── profile/        # プロフィールフォーム
│   │   ├── settings/       # テーマカラー選択
│   │   ├── providers/      # Jotai Provider
│   │   └── ui/             # 汎用 UI（アイコン等）
│   ├── lib/
│   │   ├── schemas/        # Zod スキーマ（task / user / settings）
│   │   ├── themes.ts       # テーマカラー定義・CSS 変数適用
│   │   └── task-utils.ts   # 進捗計算などの純粋関数
│   ├── store/
│   │   └── atoms.ts        # Jotai atom（アプリ全体の状態）
│   └── test/
│       └── setup.ts        # Vitest セットアップ
└── docs/
    └── design/             # デザイン参考資料（git 管理外）
```

## 状態管理

アプリの状態（TODO・ユーザー情報・テーマ）は **Jotai** でインメモリ管理しています。localStorage は使用しません。

## Node.js

Node.js `22.22.0`（mise で管理）

## キャプチャ

<img width="800" alt="スクリーンショット 2026-06-10 18 18 52" src="https://github.com/user-attachments/assets/01fb3999-7a4d-46ad-a2f7-d966d5d66517" />

<img width="800" alt="スクリーンショット 2026-06-10 18 18 59" src="https://github.com/user-attachments/assets/28f4059c-0cb8-4fa6-a17b-07cbebee8229" />

<img width="800" alt="スクリーンショット 2026-06-10 18 19 10" src="https://github.com/user-attachments/assets/f10943d1-cad9-4a07-93d1-92aff3b491af" />
