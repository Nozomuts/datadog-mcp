# Datadog MCP Server

[English (This Document)](/README.md) | [日本語](/README-ja.md)

MCP Server for Datadog API, enabling log search, trace span search, and trace span aggregation functionalities.

<a href="https://glama.ai/mcp/servers/@Nozomuts/datadog-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Nozomuts/datadog-mcp/badge" alt="Datadog Server MCP server" />
</a>

## Features

- **Log Search**: Search and retrieve logs from Datadog with flexible query options
- **Trace Span Search**: Search for distributed trace spans with various filtering options
- **Trace Span Aggregation**: Aggregate trace spans by different dimensions for analysis

## Tools

1. `search_logs`
   - Search for logs in Datadog
   - Inputs:
     - `filterQuery` (optional string): Query string to search logs (default: "*")
     - `filterFrom` (optional number): Search start time as UNIX timestamp in seconds (default: 15 minutes ago)
     - `filterTo` (optional number): Search end time as UNIX timestamp in seconds (default: current time)
     - `pageLimit` (optional number): Maximum number of logs to retrieve (default: 25, max: 1000)
     - `pageCursor` (optional string): Pagination cursor for retrieving additional results
   - Returns: Formatted text containing:
     - Search conditions (query and time range)
     - Number of logs found
     - Next page cursor (if available)
     - Log details including:
       - Service name
       - Tags
       - Timestamp
       - Status
       - Message (truncated to 300 characters)
       - Host
       - Important attributes (http.method, http.url, http.status_code, error)

2. `search_spans`
   - Search for trace spans in Datadog
   - Inputs:
     - `filterQuery` (optional string): Query string to search spans (default: "*")
     - `filterFrom` (optional number): Search start time as UNIX timestamp in seconds (default: 15 minutes ago)
     - `filterTo` (optional number): Search end time as UNIX timestamp in seconds (default: current time)
     - `pageLimit` (optional number): Maximum number of spans to retrieve (default: 25, max: 1000)
     - `pageCursor` (optional string): Pagination cursor for retrieving additional results
   - Returns: Formatted text containing:
     - Search conditions (query and time range)
     - Number of spans found
     - Next page cursor (if available)
     - Span details including:
       - Service name
       - Timestamp
       - Resource name
       - Duration (in seconds)
       - Host
       - Environment
       - Type
       - Important attributes (http.method, http.url, http.status_code, error)

3. `aggregate_spans`
   - Aggregate trace spans in Datadog by specified dimensions
   - Inputs:
     - `filterQuery` (optional string): Query string to filter spans for aggregation (default: "*")
     - `filterFrom` (optional number): Start time as UNIX timestamp in seconds (default: 15 minutes ago)
     - `filterTo` (optional number): End time as UNIX timestamp in seconds (default: current time)
     - `groupBy` (optional string[]): Dimensions to group by (e.g., ["service", "resource_name", "status"])
     - `aggregation` (optional string): Aggregation method - "count", "avg", "sum", "min", "max", "pct" (default: "count")
     - `interval` (optional string): Time interval for time series data (only when type is "timeseries")
     - `type` (optional string): Result type, either "timeseries" or "total" (default: "timeseries")
   - Returns: Formatted text containing:
     - Aggregation results in buckets, each including:
       - Bucket ID
       - Group by values (if groupBy is specified)
       - Computed values based on the aggregation method
     - Additional metadata:
       - Processing time (elapsed)
       - Request ID
       - Status
       - Warnings (if any)

## Setup
You need to set up Datadog API and application keys:

1. Get your API key and application key from the [Datadog API Keys page](https://app.datadoghq.com/organization-settings/api-keys)
2. Install dependencies in the datadog-mcp project:
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

### Docker Setup
You can build using Docker with the following command:

```bash
docker build -t datadog-mcp .
```

### Usage with Claude Desktop
To use this with Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "datadog": {
      "command": "node",
      "args": [
        "/path/to/datadog-mcp/build/index.js"
      ],
      "env": {
        "DD_API_KEY": "<YOUR_DATADOG_API_KEY>",
        "DD_APP_KEY": "<YOUR_DATADOG_APP_KEY>"
      }
    }
  }
}
```

If you're using Docker, you can configure it like this:

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
          "/path/to/datadog-mcp/build/index.js"
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

If you're using Docker, you can configure it like this:

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
        "/path/to/datadog-mcp/build/index.js"
      ],
      "env": {
        "DD_API_KEY": "<YOUR_DATADOG_API_KEY>",
        "DD_APP_KEY": "<YOUR_DATADOG_APP_KEY>"
      }
    }
  }
}
```

If you're using Docker, you can configure it like this:

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
        "DD_API_KEY": "<YOUR_DATADOG_API_KEY>",
        "DD_APP_KEY": "<YOUR_DATADOG_APP_KEY>"
      }
    }
  }
}
```