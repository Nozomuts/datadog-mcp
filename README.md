# Datadog MCP Server

[English](#datadog-mcp-server-english) | [日本語](#datadog-mcp-server-japanese)

---

## Datadog MCP Server (English)

MCP Server for Datadog API, enabling log search, trace span search, and trace span aggregation functionalities.

### Features

- **Log Search**: Search and retrieve logs from Datadog with flexible query options
- **Trace Span Search**: Search for distributed trace spans with various filtering options
- **Trace Span Aggregation**: Aggregate trace spans by different dimensions for analysis

## Tools

1. `search_logs`
   - Search for logs in Datadog
   - Inputs:
     - `filterQuery` (optional string): Query string to search logs (default: "*")
     - `filterFrom` (optional number): Search start time as UNIX timestamp in seconds (default: 1 hour ago)
     - `filterTo` (optional number): Search end time as UNIX timestamp in seconds (default: current time)
     - `pageLimit` (optional number): Maximum number of logs to retrieve (default: 25, max: 1000)
     - `pageCursor` (optional string): Pagination cursor for retrieving additional results
   - Returns: Formatted logs and raw log data

2. `search_spans`
   - Search for trace spans in Datadog
   - Inputs:
     - `filterQuery` (optional string): Query string to search spans (default: "*")
     - `filterFrom` (optional number): Search start time as UNIX timestamp in seconds (default: 15 minutes ago)
     - `filterTo` (optional number): Search end time as UNIX timestamp in seconds (default: current time)
     - `pageLimit` (optional number): Maximum number of spans to retrieve (default: 25, max: 1000)
     - `pageCursor` (optional string): Pagination cursor for retrieving additional results
   - Returns: Formatted span information including trace details, services, and timing data

3. `aggregate_spans`
   - Aggregate trace spans in Datadog by specified dimensions
   - Inputs:
     - `filterQuery` (optional string): Query string to filter spans for aggregation (default: "*")
     - `filterFrom` (optional number): Start time as UNIX timestamp in seconds (default: 15 minutes ago)
     - `filterTo` (optional number): End time as UNIX timestamp in seconds (default: current time)
     - `groupBy` (optional string[]): Dimensions to group by (e.g., ["service", "resource_name", "status"])
     - `aggregation` (optional string): Aggregation method (default: "count")
     - `interval` (optional string): Time interval for time series data (default: "5m")
     - `type` (optional string): Result type, either "timeseries" or "total" (default: "timeseries")
   - Returns: Aggregated span data in buckets with computation results

## Setup
You need to set up Datadog API and application keys:

1. Get your API key and application key from the [Datadog API Keys page](https://app.datadoghq.com/organization-settings/api-keys)
2. Install dependencies in the dd-mcp project:
   ```bash
   npm install
   # or
   pnpm install
   ```
3. Build the TypeScript project:
   ```bash
   npm run build
   # or
   pnpm run build
   ```

### Usage with Claude Desktop
To use this with Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "datadog": {
      "command": "node",
      "args": [
        "/path/to/dd-mcp/build/index.js"
      ],
      "env": {
        "DD_API_KEY": "<YOUR_DATADOG_API_KEY>",
        "DD_APP_KEY": "<YOUR_DATADOG_APP_KEY>"
      }
    }
  }
}
```

### Usage with VS Code

For quick installation in VS Code, configure your settings:

1. Open User Settings (JSON) in VS Code (`Ctrl+Shift+P` → `Preferences: Open User Settings (JSON)`)
2. Add the following configuration:

```json
{
  "mcp": {
    "servers": {
      "datadog": {
        "command": "node",
        "args": [
          "/path/to/dd-mcp/build/index.js"
        ],
        "env": {
          "DD_API_KEY": "<YOUR_DATADOG_API_KEY>",
          "DD_APP_KEY": "<YOUR_DATADOG_APP_KEY>"
        }
      }
    }
  }
}
```

Alternatively, you can add this to a `.vscode/mcp.json` file in your workspace (without the `mcp` key):

```json
{
  "servers": {
    "datadog": {
      "command": "node",
      "args": [
        "/path/to/dd-mcp/build/index.js"
      ],
      "env": {
        "DD_API_KEY": "<YOUR_DATADOG_API_KEY>",
        "DD_APP_KEY": "<YOUR_DATADOG_APP_KEY>"
      }
    }
  }
}
```

---

## Datadog MCP Server (Japanese)

DatadogのAPIにアクセスするためのMCPサーバーで、ログ検索、トレーススパン検索、トレーススパン集計機能を提供します。

### 機能

- **ログ検索**: 柔軟なクエリオプションでDatadogからログを検索・取得
- **トレーススパン検索**: さまざまな条件で分散トレーススパンを検索
- **トレーススパン集計**: 分析のためにトレーススパンを異なる次元で集計

## ツール

1. `search_logs`
   - Datadogのログを検索するツール
   - 入力パラメータ:
     - `filterQuery` (任意, 文字列): ログ検索用クエリ文字列（デフォルト: "*"）
     - `filterFrom` (任意, 数値): 検索開始時間（UNIXタイムスタンプ、秒単位、デフォルト: 1時間前）
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
   - 戻り値: トレース詳細、サービス、タイミングデータなどを含むフォーマット済みスパン情報

3. `aggregate_spans`
   - Datadogのトレーススパンを指定された次元で集計するツール
   - 入力パラメータ:
     - `filterQuery` (任意, 文字列): 集計対象スパンのフィルタ用クエリ文字列（デフォルト: "*"）
     - `filterFrom` (任意, 数値): 開始時間（UNIXタイムスタンプ、秒単位、デフォルト: 15分前）
     - `filterTo` (任意, 数値): 終了時間（UNIXタイムスタンプ、秒単位、デフォルト: 現在時刻）
     - `groupBy` (任意, 文字列[]): グループ化する次元（例: ["service", "resource_name", "status"]）
     - `aggregation` (任意, 文字列): 集計方法（デフォルト: "count"）
     - `interval` (任意, 文字列): 時系列データの間隔（デフォルト: "5m"）
     - `type` (任意, 文字列): 結果タイプ、"timeseries"または"total"（デフォルト: "timeseries"）
   - 戻り値: バケット内の集計されたスパンデータと計算結果

## セットアップ
DatadogのAPIキーとアプリケーションキーの設定が必要です：

1. [DatadogのAPIキーページ](https://app.datadoghq.com/organization-settings/api-keys)からAPIキーとアプリケーションキーを取得
2. dd-mcpで依存関係のインストール：
   ```bash
   npm install
   # または
   pnpm install
   ```
3. dd-mcpでTypeScriptプロジェクトのビルド：
   ```bash
   npm run build
   # または
   pnpm run build
   ```

### Claude Desktopでの使用法
Claude Desktopで使用するには、`claude_desktop_config.json`に以下を追加してください：

```json
{
  "mcpServers": {
    "datadog": {
      "command": "node",
      "args": [
        "/path/to/dd-mcp/build/index.js"
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
          "/path/to/dd-mcp/build/index.js"
        ],
        "env": {
          "DD_API_KEY": "<YOUR_DATADOG_API_KEY>",
          "DD_APP_KEY": "<YOUR_DATADOG_APP_KEY>"
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
        "/path/to/dd-mcp/build/index.js"
      ],
      "env": {
        "DD_API_KEY": "<YOUR_DATADOG_API_KEY>",
        "DD_APP_KEY": "<YOUR_DATADOG_APP_KEY>"
      }
    }
  }
}
```