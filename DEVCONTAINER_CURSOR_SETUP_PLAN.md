## 目的
- 既存の `.devcontainer` を維持しつつ、コンテナ内で Cursor CLI を利用可能にする
- Dev Container CLI を使って起動と `cursor-agent` コマンドの実行確認まで自動化する

## 現状把握（抜粋）
- ベース: `.devcontainer/Dockerfile` は `FROM node:20`
- `devcontainer.json`
  - `build.dockerfile`: `Dockerfile`
  - `remoteUser`: `node`
  - `postCreateCommand`: `sudo /usr/local/bin/init-firewall.sh`
  - Claude Code: `@anthropic-ai/claude-code` を Dockerfile で `npm -g` にて導入済み
- `init-firewall.sh`: 生成規則を流し、許可先を厳選（GitHub、npm、Anthropic 等）。`cursor.com` は現状含まれない

## 方針（最小変更）
- ベースイメージ・`devcontainer.json` は極力変更しない
- Cursor CLI は Dockerfile ビルド時に導入（`postCreateCommand` 実行後は通信が絞られるため）
- 非 root ユーザー（`node`）で利用できるように PATH を整える
- 可能であればファイアウォール側に `cursor.com` 系ドメインを追記（任意。CLI 実行時にオンライン通信が必要な場合に備える）

## 具体変更内容
### 1) `.devcontainer/Dockerfile` への追加
- 追加位置: `USER node` 以降（`@anthropic-ai/claude-code` 導入後の近辺で OK）
- 追加内容:
  - Cursor CLI インストール
    - `RUN curl https://cursor.com/install -fsS | bash`
  - PATH 追記（`node` ユーザーのホーム配下に入る想定）
    - `ENV PATH=$PATH:/home/node/.cursor/bin`
  - 代替案: バイナリを `/usr/local/bin` にシンボリックリンク（PATH 変更を避けたい場合）

### 2) `init-firewall.sh`（任意）
- 許可ドメインに `cursor.com`（必要に応じて `api.cursor.com` 等）を追記
- 目的: CLI 実行時に更新や認証で外部接続が必要なケースの保険
- 変更最小化のため、初回は未変更でテスト → 失敗したら追記

### 3) `devcontainer.json`
- 現状維持（変更なし）。PATH は Dockerfile の `ENV` で解決

## 検証手順（Dev Container CLI）
前提: ホストに Dev Container CLI を導入
- npm: `npm i -g @devcontainers/cli`
- または Homebrew: `brew install devcontainer`

手順:
1) 起動
   - `devcontainer up --workspace-folder .`
2) バイナリ検出
   - `devcontainer exec --workspace-folder . -- bash -lc "command -v cursor-agent || command -v cursor || echo not-found"`
3) ヘルプ/バージョン表示
   - `devcontainer exec --workspace-folder . -- bash -lc "cursor-agent --help || cursor-agent --version || cursor --help || cursor --version"`
4) 失敗時の PATH/配置確認
   - `devcontainer exec --workspace-folder . -- bash -lc "echo $PATH && ls -al ~ /home/node/.cursor/bin || true"`

成功条件:
- `devcontainer up` が成功し、コンテナ内で `cursor-agent`（あるいは `cursor`）のヘルプまたはバージョンが表示される

## リスクと対処
- ファイアウォールによりインストーラ/CLI のネットワーク到達性が阻害
  - 対処: インストールは Docker ビルド時に実施（`postCreateCommand` 前）。必要に応じて `init-firewall.sh` に `cursor.com` を追記
- インストール先が PATH に含まれない
  - 対処: Dockerfile で `ENV PATH=$PATH:/home/node/.cursor/bin` を設定、または `/usr/local/bin` へ symlink
- コマンド名の相違
  - `cursor-agent` と `cursor` の双方で検出・実行を試行

## 作業ステップ
1) Dockerfile に Cursor CLI 導入 RUN と PATH 追記を加える
2) Dev Container を再ビルド・起動（`devcontainer up`）
3) `cursor-agent`（なければ `cursor`）の実行確認
4) 必要に応じて `init-firewall.sh` に `cursor.com` 系ドメインを追記

## ロールバック
- Dockerfile の追加行を取り消し、再ビルド
- （任意）`init-firewall.sh` の追記を元に戻す

## 補足
- 依頼文中の `cursro-agent` はタイポ想定。計画では `cursor-agent` を主対象とし、`cursor` もフォールバックでチェックします
