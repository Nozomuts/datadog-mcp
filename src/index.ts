import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { listMonitorsHandler, listMonitorsSchema } from "./tools/monitors.js";

// コマンドライン引数をパースする関数
const parseArgs = () => {
  const args = process.argv.slice(2);
  const result: { apiKey?: string; appKey?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--api-key" && i + 1 < args.length) {
      result.apiKey = args[i + 1];
      i++;
    } else if (args[i] === "--app-key" && i + 1 < args.length) {
      result.appKey = args[i + 1];
      i++;
    }
  }

  return result;
};

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
        name: "list_monitors",
        description: "Datadogのモニター一覧を取得します",
        parameters: listMonitorsSchema,
      },
    ],
  };
});

// ツール呼び出しのリクエストハンドラーを設定
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name: toolName, parameters } = request.params;

  // switch文を使ってツールを振り分け
  switch (toolName) {
    case "list_monitors":
      return await listMonitorsHandler(parameters);
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
  // コマンドライン引数をパース
  const args = parseArgs();

  // コマンドライン引数で指定されたキーがあれば環境変数を上書き
  if (args.apiKey) {
    process.env.DD_API_KEY = args.apiKey;
  }

  if (args.appKey) {
    process.env.DD_APP_KEY = args.appKey;
  }

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
