import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { searchLogsHandler, searchLogsZodSchema } from "./tools/logs.js";

// McpServerを使用してサーバーを作成
const server = new McpServer({
  name: "datadog-mcp-server",
  version: "1.0.0",
});

// ツールを登録
server.tool(
  "search_logs",
  "Datadogのログを検索するツール",
  searchLogsZodSchema.shape,
  async (args) => {
    const result = await searchLogsHandler(args);
    return {
      content: result.content,
      isError: result.isError,
    };
  }
);

const main = async () => {
  // DatadogのAPIキーが設定されているか確認
  if (!process.env.DD_API_KEY || !process.env.DD_APP_KEY) {
    console.error(
      "警告: Datadog API_KEY または APP_KEY が設定されていません。Datadogツールは正しく機能しない可能性があります。"
    );
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Datadog MCP Server が stdio で動作中");
};

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
