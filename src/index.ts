import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { searchLogsHandler, searchLogsZodSchema } from "./tools/logs.js";
import {
  searchSpansHandler,
  searchSpansZodSchema,
  aggregateSpansHandler,
  aggregateSpansZodSchema,
} from "./tools/spans.js";

const server = new McpServer({
  name: "datadog-mcp-server",
  version: "1.0.0",
});

server.tool(
  "search_logs",
  "Datadogのログを検索するツール",
  searchLogsZodSchema.shape,
  searchLogsHandler
);

server.tool(
  "search_spans",
  "Datadogのトレースspanを検索するツール",
  searchSpansZodSchema.shape,
  searchSpansHandler
);

server.tool(
  "aggregate_spans",
  "Datadogのトレースspanを集計するツール",
  aggregateSpansZodSchema.shape,
  aggregateSpansHandler
);

const main = async () => {
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
