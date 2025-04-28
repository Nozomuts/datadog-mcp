# Datadog MCP Server

DatadogのAPIにアクセスするためのMCPサーバーで、ログ検索、トレーススパン検索、トレーススパン集計機能を提供します。

<a href="https://glama.ai/mcp/servers/@Nozomuts/datadog-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Nozomuts/datadog-mcp/badge" alt="Datadog Server MCP server" />
</a>

## 機能

- **ログ検索**: 柔軟なクエリオプションでDatadogからログを検索・取得
- **トレーススパン検索**: さまざまな条件で分散トレーススパンを検索
- **トレーススパン集計**: 分析のためにトレーススパンを異なる次元で集計

## ツール

1. `search_logs`
   - Datadogのログを検索するツール
   - 入力パラメータ:
     - `filterQuery` (任意, 文字列): ログ検索用クエリ文字列（デフォルト: "*"）
     - `filterFrom` (任意, 数値): 検索開始時間（UNIXタイムスタンプ、秒単位、デフォルト: 15分前）
     - `filterTo` (任意, 数値): 検索終了時間（UNIXタイムスタンプ、秒単位、デフォルト: 現在時刻）
     - `pageLimit` (任意, 数値): 取得するログの最大数（デフォルト: 25、最大: 1000）
     - `pageCursor` (任意, 文字列): 追加結果を取得するためのページネーションカーソル
   - 戻り値: フォーマット済みログと生ログデータ

2. `search_spans`
   - Datadogのトレーススパンを検索するツール
   - 入力パラメータ:
     - `filterQuery` (任意, 文字列): スパン検索用クエリ文字列（デフォルト: "*"）
     - `filterFrom` (任意, 数値): 検索開始時間（UNIXタイムスタンプ、秒単位、デフォルト: 15分前）
     - `filterTo` (任意, 数値): 検索終了時間（UNIXタイムスタンプ、秒単位、デフォルト: 現在時刻）
     - `pageLimit` (任意, 数値): 取得するスパンの最大数（デフォルト: 25、最大: 1000）
     - `pageCursor` (任意, 文字列): 追加結果を取得するためのページネーションカーソル
   - 戻り値: フォーマット済みスパン情報

3. `aggregate_spans`
   - Datadogのトレーススパンを指定された次元で集計するツール
   - 入力パラメータ:
     - `filterQuery` (任意, 文字列): 集計対象スパンのフィルタ用クエリ文字列（デフォルト: "*"）
     - `filterFrom` (任意, 数値): 開始時間（UNIXタイムスタンプ、秒単位、デフォルト: 15分前）
     - `filterTo` (任意, 数値): 終了時間（UNIXタイムスタンプ、秒単位、デフォルト: 現在時刻）
     - `groupBy` (任意, 文字列[]): グループ化する次元（例: ["service", "resource_name", "status"]）
     - `aggregation` (任意, 文字列): 集計方法 - "count", "avg", "sum", "min", "max", "pct"（デフォルト: "count"）
     - `interval` (任意, 文字列): 時系列データの間隔（typeが"timeseries"の時のみ指定）
     - `type` (任意, 文字列): 結果タイプ、"timeseries"または"total"（デフォルト: "timeseries"）
   - 戻り値: フォーマット済みテキスト、含まれるもの：
     - バケット内の集計結果、各バケットには以下が含まれる：
       - バケットID
       - グループ化された値（groupByが指定されている場合）
       - 集計方法に基づいて計算された値
     - 追加のメタデータ：
       - 処理時間（経過時間）
       - リクエストID
       - ステータス
       - 警告（ある場合）

## セットアップ
DatadogのAPIキーとアプリケーションキーの設定が必要です：

1. [DatadogのAPIキーページ](https://app.datadoghq.com/organization-settings/api-keys)からAPIキーとアプリケーションキーを取得
2. datadog-mcpで依存関係のインストール：
   ```bash
   npm install
   # または
   pnpm install
   ```
3. datadog-mcpでTypeScriptプロジェクトのビルド：
   ```bash
   npm run build
   # または
   pnpm run build
   ```

### Dockerでのセットアップ
Dockerを使用してセットアップする場合、以下のコマンドでビルドできます：

```bash
docker build -t datadog-mcp .
```

### Claude Desktopでの使用法
Claude Desktopで使用するには、`claude_desktop_config.json`に以下を追加してください：

```json
{
  "mcpServers": {
    "datadog": {
      "command": "node",
      "args": [
        "/path/to/datadog-mcp/build/index.js"
      ],
      "env": {
        "DD_API_KEY": "<あなたのDATADOG_APIキー>",
        "DD_APP_KEY": "<あなたのDATADOG_APPキー>"
      }
    }
  }
}
```

Dockerを使用する場合は以下のように設定できます：

```json
{
  "mcpServers": {
    "datadog": {
      "command": "docker",
        "args": [
          "run",
          "-i",
          "--rm",
          "-e",
          "DD_API_KEY",
          "-e",
          "DD_APP_KEY",
          "datadog-mcp"
        ],
      "env": {
        "DD_API_KEY": "<あなたのDATADOG_APIキー>",
        "DD_APP_KEY": "<あなたのDATADOG_APPキー>"
      }
    }
  }
}
```

### VS Codeでの使用法

VS Codeですぐに使用するための設定方法：

1. VS Codeでユーザー設定（JSON）を開く（`Ctrl+Shift+P` → `Preferences: Open User Settings (JSON)`）
2. 次の設定を追加：

```json
{
  "mcp": {
    "servers": {
      "datadog": {
        "command": "node",
        "args": [
          "/path/to/datadog-mcp/build/index.js"
        ],
        "env": {
          "DD_API_KEY": "<あなたのDATADOG_APIキー>",
          "DD_APP_KEY": "<あなたのDATADOG_APPキー>"
        }
      }
    }
  }
}
```

Dockerを使用する場合は、以下のように設定できます：

```json
{
  "mcp": {
    "servers": {
      "datadog": {
        "command": "docker",
          "args": [
          "run",
          "-i",
          "--rm",
          "-e",
          "DD_API_KEY",
          "-e",
          "DD_APP_KEY",
          "datadog-mcp"
        ],
        "env": {
          "DD_API_KEY": "<あなたのDATADOG_APIキー>",
          "DD_APP_KEY": "<あなたのDATADOG_APPキー>"
        }
      }
    }
  }
}
```

または、ワークスペースの`.vscode/mcp.json`ファイルに以下を追加することもできます（`mcp`キーなし）：

```json
{
  "servers": {
    "datadog": {
      "command": "node",
      "args": [
        "/path/to/datadog-mcp/build/index.js"
      ],
      "env": {
        "DD_API_KEY": "<あなたのDATADOG_APIキー>",
        "DD_APP_KEY": "<あなたのDATADOG_APPキー>"
      }
    }
  }
}
```

Dockerを使用する場合は、以下のように設定できます：

```json
{
  "servers": {
    "datadog": {
      "command": "docker",
        "args": [
          "run",
          "-i",
          "--rm",
          "-e",
          "DD_API_KEY",
          "-e",
          "DD_APP_KEY",
          "datadog-mcp"
        ],
      "env": {
        "DD_API_KEY": "<あなたのDATADOG_APIキー>",
        "DD_APP_KEY": "<あなたのDATADOG_APPキー>"
      }
    }
  }
}
```