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
    .default(Date.now() / 1000 - 15 * 60)
    .describe(
      "検索開始時間（UNIXタイムスタンプ、秒単位、オプション、デフォルトは15分前）"
    ),
  filterTo: z
    .number()
    .optional()
    .default(Date.now() / 1000)
    .describe(
      "検索終了時間（UNIXタイムスタンプ、秒単位、オプション、デフォルトは現在時刻）"
    ),
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
    .describe("次のページを取得するためのカーソル（オプション）"),
});

const formatSpansResult = (
  result: SpanSearchResult,
  query: string | undefined,
  startDate: Date,
  endDate: Date
): string => {
  const searchSummary = `# Span検索結果\n\n## 検索条件\n* **クエリ:** \`${
    query || "*"
  }\`\n* **期間:** ${startDate.toLocaleString()} から ${endDate.toLocaleString()}\n* **取得件数:** ${
    result.spans.length
  }件${result.spans.length === 0 ? " (該当するSpanはありませんでした)" : ""}\n`;

  const paginationInfo = result.nextCursor
    ? `\n## ページング\n* **次のページカーソル:** \`${result.nextCursor}\`\n`
    : "";

  if (result.spans.length === 0) {
    return searchSummary;
  }

  const spanSummaries = result.spans
    .map((span, index) => {
      const timestamp = span.startTimestamp
        ? new Date(span.startTimestamp).toLocaleString()
        : "不明な日時";
      const service = span.service || "不明なサービス";
      const resource = span.resource || "不明なリソース";
      const duration = span.duration
        ? `${(span.duration / 1000).toFixed(3)}秒`
        : "不明な所要時間";
      const host = span.host || "不明なホスト";
      const env = span.env || "不明な環境";
      const type = span.type || "不明なタイプ";

      let summary = `### [${index + 1}] ${service}\n`;
      summary += `* **時刻:** ${timestamp}\n`;
      summary += `* **リソース:** ${resource}\n`;
      summary += `* **所要時間:** ${duration}\n`;
      summary += `* **Trace ID:** \`${span.traceId || "N/A"}\`\n`;
      summary += `* **ホスト:** ${host}\n`;
      summary += `* **環境:** ${env}\n`;
      summary += `* **タイプ:** ${type}\n`;

      // 重要な属性があれば表示
      if (span.attributes && Object.keys(span.attributes).length > 0) {
        const importantAttrs = ["http.method", "http.status_code", "error"];
        const displayAttrs = importantAttrs
          .filter((key) => key in span.attributes!)
          .map(
            (key) => `* **${key}:** \`${JSON.stringify(span.attributes![key])}\``
          )
          .join("\n");

        if (displayAttrs) {
          summary += `\n#### 重要な属性\n${displayAttrs}\n`;
        }
      }

      return summary;
    })
    .join("\n\n");

  return `${searchSummary}${paginationInfo}\n## Spanサマリー\n\n${spanSummaries}`;
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
    // バリデーション後に Date オブジェクトに変換
    const validatedParams = {
      ...validation.data,
      filterFrom: new Date(validation.data.filterFrom * 1000),
      filterTo: new Date(validation.data.filterTo * 1000),
    };

    const result = await searchSpans(validatedParams);
    const formattedResult = formatSpansResult(
      result,
      validatedParams.filterQuery,
      validatedParams.filterFrom,
      validatedParams.filterTo
    );
    return createSuccessResponse([formattedResult]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`スパン検索エラー: ${errorMessage}`);
  }
};
