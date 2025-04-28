import { z } from "zod";
import { searchSpans } from "../../datadog/spans/search.js";
import { createSuccessResponse, createErrorResponse } from "../../utils.js";
import type { SpanSearchResult, ToolResponse } from "../../types.js";

export const searchSpansZodSchema = z.object({
  filterQuery: z
    .string()
    .optional()
    .default("*")
    .describe("Query string to search for (optional, default is '*')"),
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
    .describe("Maximum number of spans to retrieve (optional, default is 25)"),
  pageCursor: z
    .string()
    .optional()
    .describe("Cursor to retrieve the next page (optional)"),
});

const generateSummaryText = (
  data: z.infer<typeof searchSpansZodSchema>,
  result: SpanSearchResult
): string => {
  let responseText = "";
  responseText += `# Span Search Results\n`;
  responseText += `## Search Criteria\n`;
  responseText += `* Query: ${data.filterQuery || "*"}\n`;
  responseText += `* Time Range: ${new Date(
    data.filterFrom * 1000
  ).toLocaleString()} to ${new Date(data.filterTo * 1000).toLocaleString()}\n`;
  responseText += `* Retrieved: ${result.spans.length} spans`;

  if (result.spans.length === 0) {
    return responseText;
  }

  if (result.nextCursor) {
    responseText += `* Next Page Cursor: ${result.nextCursor}\n`;
  }

  responseText += "## Span Summary\n";
  for (const [index, span] of result.spans.entries()) {
    responseText += `### [${index + 1}]\n`;
    if (span.service) {
      responseText += `* Service: ${span.service}\n`;
    }

    if (span.startTimestamp) {
      responseText += `* Time: ${new Date(
        span.startTimestamp
      ).toLocaleString()}\n`;
    }

    if (span.resource) {
      responseText += `* Resource: ${span.resource}\n`;
    }

    if (span.duration) {
      responseText += `* Duration: ${(span.duration / 1000).toFixed(
        3
      )} seconds\n`;
    }

    if (span.host) {
      responseText += `* Host: ${span.host}\n`;
    }

    if (span.env) {
      responseText += `* Environment: ${span.env}\n`;
    }

    if (span.type) {
      responseText += `* Type: ${span.type}\n`;
    }

    responseText += `#### Key Attributes\n`;
    for (const key of [
      "http.method",
      "http.url",
      "http.status_code",
      "error",
    ]) {
      if (span.attributes && key in span.attributes) {
        responseText += `* ${key}: \`${JSON.stringify(
          span.attributes[key]
        )}\`\n`;
      }
    }
  }

  return responseText;
};

export const searchSpansHandler = async (
  parameters: z.infer<typeof searchSpansZodSchema>
): Promise<ToolResponse> => {
  const validation = searchSpansZodSchema.safeParse(parameters);
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

    const result = await searchSpans(validatedParams);
    const formattedResult = generateSummaryText(validation.data, result);
    const urlText = `[View in Datadog](https://app.datadoghq.com/apm/traces?query=${encodeURIComponent(
      validation.data.filterQuery
    )}&start=${validation.data.filterFrom}&end=${validation.data.filterTo})`;
    return createSuccessResponse([formattedResult, urlText]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Span search error: ${errorMessage}`);
  }
};
