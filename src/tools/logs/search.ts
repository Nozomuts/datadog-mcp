import { z } from "zod";
import { searchLogs } from "../../datadog/logs/search.js";
import { createErrorResponse, createSuccessResponse } from "../../utils.js";
import type { Log, ToolResponse } from "../../types.js";

export const searchLogsZodSchema = z.object({
  filterQuery: z
    .string()
    .optional()
    .default("*")
    .describe("Query string to search logs (optional, default is '*')"),
  filterFrom: z
    .number()
    .optional()
    .default(Date.now() / 1000 - 15 * 60)
    .describe(
      "Search start time (UNIX timestamp in seconds, optional, default is 15 minutes ago)"
    ),
  filterTo: z
    .number()
    .optional()
    .default(Date.now() / 1000)
    .describe(
      "Search end time (UNIX timestamp in seconds, optional, default is current time)"
    ),
  pageLimit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .default(25)
    .describe("Maximum number of logs to retrieve (optional, default is 25)"),
  pageCursor: z
    .string()
    .optional()
    .describe("Cursor to retrieve the next page (optional)"),
});

const generateSummaryText = (
  data: z.infer<typeof searchLogsZodSchema>,
  result: {
    logs: Log[];
    nextCursor?: string;
  }
): string => {
  let responseText = "";
  responseText += "# Log Search Results\n";
  responseText += "## Search Criteria\n";
  responseText += `* Query: ${data.filterQuery || "*"}\n`;
  responseText += `* Time Range: ${new Date(
    data.filterFrom * 1000
  ).toLocaleString()} to ${new Date(data.filterTo * 1000).toLocaleString()}\n`;
  responseText += `* Retrieved: ${result.logs.length} logs\n`;

  if (result.logs.length === 0) {
    return responseText;
  }

  if (result.nextCursor) {
    responseText += "## Pagination\n";
    responseText += `* Next Page Cursor: ${result.nextCursor}\n`;
  }

  responseText += "## Log Summary\n";
  const MAX_MESSAGE_LENGTH = 300;
  for (const [index, log] of result.logs.entries()) {
    responseText += `### [${index + 1}]\n`;
    if (log.service) {
      responseText += `* Service: ${log.service}\n`;
    }
    if (log.tags && log.tags.length > 0) {
      responseText += `* Tags: ${log.tags.join(", ")}\n`;
    }
    if (log.timestamp) {
      responseText += `* Time: ${new Date(log.timestamp).toLocaleString()}\n`;
    }
    if (log.status) {
      responseText += `* Status: ${log.status}\n`;
    }
    if (log.message) {
      responseText += `* Message: ${log.message.slice(0, MAX_MESSAGE_LENGTH)}${
        log.message.length > MAX_MESSAGE_LENGTH ? "..." : ""
      }\n`;
    }
    if (log.host) {
      responseText += `* Host: ${log.host}\n`;
    }

    responseText += `#### Key Attributes\n`;
    for (const key of [
      "http.method",
      "http.url",
      "http.status_code",
      "error",
    ]) {
      if (log.attributes && key in log.attributes) {
        responseText += `* ${key}: \`${JSON.stringify(
          log.attributes[key]
        )}\`\n`;
      }
    }
  }

  return responseText;
};

export const searchLogsHandler = async (
  parameters: z.infer<typeof searchLogsZodSchema>
): Promise<ToolResponse> => {
  const validation = searchLogsZodSchema.safeParse(parameters);
  if (!validation.success) {
    return createErrorResponse(
      `Parameter validation error: ${validation.error.message}`
    );
  }

  try {
    // Convert to Date objects after validation
    const validatedParams = {
      ...validation.data,
      filterFrom: new Date(validation.data.filterFrom * 1000),
      filterTo: new Date(validation.data.filterTo * 1000),
    };

    const result = await searchLogs(validatedParams);

    const summaryText = generateSummaryText(validation.data, result);
    const urlText = `[View in Datadog](https://app.datadoghq.com/logs?query=${encodeURIComponent(
      validation.data.filterQuery
    )}&start=${validation.data.filterFrom}&end=${validation.data.filterTo})`;
    return createSuccessResponse([summaryText, urlText]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Log search error: ${errorMessage}`);
  }
};
