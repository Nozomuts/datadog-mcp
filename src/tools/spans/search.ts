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

const generateSummaryText = (
  result: SpanSearchResult,
  query: string | undefined,
  startDate: Date,
  endDate: Date
): string => {
  let responseText = "";
  responseText += `# Span検索結果\n\n`;
  responseText += `## 検索条件\n`;
  responseText += `* クエリ: ${query || "*"}\n`;
  responseText += `* 期間: ${startDate.toLocaleString()} から ${endDate.toLocaleString()}\n`;
  responseText += `* 取得件数: ${result.spans.length}件`;

  if (result.spans.length === 0) {
    return responseText;
  }

  if (result.nextCursor) {
    responseText += `\n* 次のページカーソル: \`${result.nextCursor}\`\n`;
  }

  responseText += "\n## Spanサマリー\n\n";
  for (const [index, span] of result.spans.entries()) {
    responseText += `\n### [${index + 1}]`;
    if (span.service) {
      responseText += `* サービス: ${span.service}\n`;
    }

    if (span.startTimestamp) {
      responseText += `* 時刻: ${new Date(
        span.startTimestamp
      ).toLocaleString()}\n`;
    }

    if (span.resource) {
      responseText += `* リソース: ${span.resource}\n`;
    }

    if (span.duration) {
      responseText += `* 所要時間: ${(span.duration / 1000).toFixed(
        3
      )}秒\n`;
    }

    if (span.host) {
      responseText += `* ホスト: ${span.host}\n`;
    }

    if (span.env) {
      responseText += `* 環境: ${span.env}\n`;
    }

    if (span.type) {
      responseText += `* タイプ: ${span.type}\n`;
    }

    responseText += `\n#### 重要な属性\n`;
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
    const formattedResult = generateSummaryText(
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
