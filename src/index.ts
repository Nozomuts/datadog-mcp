import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { searchLogsHandler, searchLogsSchema } from "./tools/logs.js";

const server = new Server({
  name: "datadog-mcp-server",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

// ツール一覧のリクエストハンドラーを設定
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_logs",
        description: "Datadogのログを検索します",
        parameters: searchLogsSchema,
      },
    ],
  };
});

// ツール呼び出しのリクエストハンドラーを設定
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name: toolName, parameters } = request.params;

  // switch文を使ってツールを振り分け
  switch (toolName) {
    case "search_logs":
      return await searchLogsHandler(parameters);
    default:
      return {
        content: [
          {
            type: "text",
            text: `ツール "${toolName}" は見つかりませんでした`,
          },
        ],
        isError: true,
      };
  }
});

const main = async () => {
  // DatadogのAPIキーが設定されているか確認
  if (!process.env.DD_API_KEY || !process.env.DD_APP_KEY) {
    console.error(
      "警告: Datadog API_KEY または APP_KEY が設定されていません。Datadogツールは正しく機能しない可能性があります。"
    );
    console.error(
      "環境変数を設定するか、--api-key と --app-key コマンドライン引数を使用してください。"
    );
    console.error(
      "例: node build/index.js --api-key YOUR_API_KEY --app-key YOUR_APP_KEY"
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Datadog MCP Server が stdio で動作中");
};

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
