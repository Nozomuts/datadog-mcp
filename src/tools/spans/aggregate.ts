import { z } from "zod";
import { aggregateSpans } from "../../datadog/spans/aggregate.js";
import { createSuccessResponse, createErrorResponse } from "../../utils.js";
import type { SpanAggregationResult, ToolResponse } from "../../types.js";

export const aggregateSpansZodSchema = z.object({
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
  groupBy: z
    .array(
      z.enum([
        "service",
        "resource_name",
        "env",
        "status",
        "operation_name",
        "type",
        "@version",
        "@http.status_code",
        "@http.client_ip",
        "@http.url",
        "@http.method",
        "@http.host",
        "@http.user_agent",
        "@http.path_group",
        "@http.route",
      ])
    )
    .optional()
    .describe("Attributes to group by (example: ['service', 'resource_name'])"),
  interval: z
    .string()
    .optional()
    .describe(
      "Time interval to group results by (optional, only used when type is timeseries)"
    ),
  type: z
    .enum(["timeseries", "total"])
    .default("timeseries")
    .describe(
      "Result type - timeseries or total (optional, default is 'timeseries')"
    ),
});

const generateSummaryText = (
  data: z.infer<typeof aggregateSpansZodSchema>,
  result: SpanAggregationResult
): string => {
  let responseText = "";
  responseText += `# Span Aggregation Results\n`;
  responseText += `## Aggregation Criteria\n`;
  responseText += `* Query: \`${data.filterQuery || "*"}\`\n`;
  responseText += `* Time Range: ${new Date(
    data.filterFrom * 1000
  ).toLocaleString()} to ${new Date(data.filterTo * 1000).toLocaleString()}\n`;
  responseText += `* Group By: ${data.groupBy?.join(", ") || "none"}\n`;
  responseText += `* Type: ${data.type}\n`;
  if (data.interval) {
    responseText += `* Interval: ${data.interval}\n`;
  }

  if (result.status) {
    responseText += `## Status\n`;
    responseText += `* Status: ${result.status || "unknown"}\n`;
    responseText += `* Elapsed Time: ${result.elapsed || "unknown"}\n`;
  }

  if (result.buckets.length > 0) {
    responseText += `## Aggregation Results\n`;
    for (const bucket of result.buckets) {
      responseText += `### Group\n`;
      for (const [key, value] of Object.entries(bucket.by || {})) {
        responseText += `* ${key}: ${value}\n`;
      }
      for (const value of Object.values(bucket.compute || {})) {
        if (data.type === "total") {
          responseText += `* Aggregated Value: ${value}\n`;
        } else if (data.type === "timeseries") {
          for (const item of value) {
            if ("value" in item && "time" in item) {
              responseText += `* Time: ${item.time}, Value: ${item.value}\n`;
            }
          }
        }
      }
    }
  }

  if (result.warnings && result.warnings.length > 0) {
    responseText += `## Warnings\n`;
    for (const warning of result.warnings) {
      responseText += `### Details\n`;
      if (warning.title) {
        responseText += `* Title: ${warning.title}\n`;
      }
      if (warning.detail) {
        responseText += `* Detail: ${warning.detail}\n`;
      }
      if (warning.code) {
        responseText += `* Code: ${warning.code}\n`;
      }
    }
  }

  return responseText;
};

export const aggregateSpansHandler = async (
  parameters: z.infer<typeof aggregateSpansZodSchema>
): Promise<ToolResponse> => {
  const validation = aggregateSpansZodSchema.safeParse(parameters);

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

    const result = await aggregateSpans(validatedParams);
    const formattedResult = generateSummaryText(validation.data, result);
    const urlText = `[View in Datadog](https://app.datadoghq.com/apm/traces?query=${encodeURIComponent(
      validation.data.filterQuery
    )}&start=${validation.data.filterFrom}&end=${
      validation.data.filterTo
    }&viz=${
      validation.data.type === "total" ? "toplist" : validation.data.type
    }&agg_q=${validation.data.groupBy?.join(",") || ""})`;
    return createSuccessResponse([formattedResult, urlText]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Span aggregation error: ${errorMessage}`);
  }
};
