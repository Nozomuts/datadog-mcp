import { z } from "zod";
import { searchSpans } from "../../datadog/spans/search.js";
import { createSuccessResponse, createErrorResponse } from "../../utils.js";
import type { SpanSearchResult, ToolResponse } from "../../types.js";

export const searchSpansZodSchema = z.object({
  filterQuery: z
    .string()
    .optional()
    .default("*")
    .describe("検索するためのクエリ文字列（オプション、デフォルトは「*」）"),
  filterFrom: z
    .number()
    .optional()
    .default(Math.floor(Date.now() / 1000) - 15 * 60)
    .describe(
      "検索開始時間（UNIXタイムスタンプ、秒単位、オプション、デフォルトは15分前）"
    )
    .transform((date) => new Date(date * 1000)),
  filterTo: z
    .number()
    .optional()
    .default(Math.floor(Date.now() / 1000))
    .describe(
      "検索終了時間（UNIXタイムスタンプ、秒単位、オプション、デフォルトは現在時刻）"
    )
    .transform((date) => new Date(date * 1000)),
  pageLimit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .default(25)
    .describe("取得するスパンの最大数（オプション、デフォルトは25）"),
  pageCursor: z
    .string()
    .optional()
    .describe("ページネーションのカーソル（オプション）"),
});

const formatSpansResult = (result: SpanSearchResult): string => {
  const { spans, nextCursor } = result;

  if (spans.length === 0) {
    return "検索条件に一致するspanが見つかりませんでした。";
  }

  let response = `${spans.length}件のspanが見つかりました。\n\n`;

  spans.forEach((span, index) => {
    response += `[${index + 1}] ID: ${span.id}\n`;
    if (span.traceId) response += `Trace ID: ${span.traceId}\n`;
    if (span.spanId) response += `Span ID: ${span.spanId}\n`;
    if (span.parentId) response += `Parent ID: ${span.parentId}\n`;
    if (span.service) response += `Service: ${span.service}\n`;
    if (span.resource) response += `Resource: ${span.resource}\n`;
    if (span.host) response += `Host: ${span.host}\n`;
    if (span.env) response += `Environment: ${span.env}\n`;
    if (span.startTimestamp) response += `Start Time: ${span.startTimestamp}\n`;
    if (span.endTimestamp) response += `End Time: ${span.endTimestamp}\n`;
    if (span.duration) response += `Duration: ${span.duration}ms\n`;
    if (span.type) response += `Type: ${span.type}\n`;

    if (span.tags && span.tags.length > 0) {
      response += `Tags: ${span.tags.join(", ")}\n`;
    }

    if (span.attributes && Object.keys(span.attributes).length > 0) {
      response += `Attributes: ${JSON.stringify(span.attributes, null, 2)}\n`;
    }

    response += "\n";
  });

  if (nextCursor) {
    response += `次のページを取得するには cursor="${nextCursor}" を指定してください。`;
  }

  return response;
};

export const searchSpansHandler = async (
  parameters: z.infer<typeof searchSpansZodSchema>
): Promise<ToolResponse> => {
  const validation = searchSpansZodSchema.safeParse(parameters);
  if (!validation.success) {
    return createErrorResponse(
      `パラメータ検証エラー: ${validation.error.message}`
    );
  }

  try {
    const result = await searchSpans(validation.data);
    const formattedResult = formatSpansResult(result);
    return createSuccessResponse([formattedResult]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`スパン検索エラー: ${errorMessage}`);
  }
};
