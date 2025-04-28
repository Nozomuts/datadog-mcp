import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { searchLogsHandler, searchLogsZodSchema } from "./tools/logs/search.js";
import {
  aggregateSpansHandler,
  aggregateSpansZodSchema,
} from "./tools/spans/aggregate.js";
import {
  searchSpansHandler,
  searchSpansZodSchema,
} from "./tools/spans/search.js";

const server = new McpServer({
  name: "datadog-mcp-server",
  version: "1.0.0",
});

server.tool(
  "search_logs",
  "Tool for searching Datadog logs",
  searchLogsZodSchema.shape,
  searchLogsHandler
);

server.tool(
  "search_spans",
  "Tool for searching Datadog trace spans",
  searchSpansZodSchema.shape,
  searchSpansHandler
);

server.tool(
  "aggregate_spans",
  "Tool for aggregating Datadog trace spans",
  aggregateSpansZodSchema.shape,
  aggregateSpansHandler
);

const main = async () => {
  if (!process.env.DD_API_KEY || !process.env.DD_APP_KEY) {
    console.error(
      "Warning: Datadog API_KEY or APP_KEY is not set. Datadog tools may not function correctly."
    );
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
