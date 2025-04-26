import { z } from "zod";
import { aggregateSpans } from "../../datadog/spans/aggregate.js";
import {
  createSuccessResponse,
  createErrorResponse,
  parseDate,
} from "../../utils.js";
import type { SpanAggregationResult, ToolResponse } from "../../types.js";

export const aggregateSpansZodSchema = z.object({
  query: z
    .string()
    .optional()
    .describe("検索するためのクエリ文字列（オプション、デフォルトは「*」）"),
  startTime: z
    .number()
    .optional()
    .describe(
      "検索開始時間（UNIXタイムスタンプ、秒単位、オプション、デフォルトは15分前）"
    ),
  endTime: z
    .number()
    .optional()
    .describe(
      "検索終了時間（UNIXタイムスタンプ、秒単位、オプション、デフォルトは現在時刻）"
    ),
  groupBy: z
    .array(z.string())
    .optional()
    .describe(
      "グループ化する属性の配列（例：['service', 'resource_name', 'status']）"
    ),
  aggregation: z
    .string()
    .optional()
    .describe("集計方法（オプション、デフォルトは'count'）"),
  interval: z
    .string()
    .optional()
    .describe("時系列データの間隔（オプション、デフォルトは'5m'）"),
});

const formatAggregationResult = (result: SpanAggregationResult): string => {
  if (result.buckets.length === 0) {
    return "集計条件に一致するspanが見つかりませんでした。";
  }

  let response = `${result.buckets.length}件のバケットが見つかりました。\n`;

  if (result.status) {
    response += `ステータス: ${result.status}\n`;
  }

  if (result.elapsed) {
    response += `処理時間: ${result.elapsed}ms\n`;
  }

  response += "\n集計結果:\n";

  result.buckets.forEach((bucket, index) => {
    response += `[${index + 1}] ID: ${bucket.id}\n`;

    if (bucket.by && Object.keys(bucket.by).length > 0) {
      response += "グループ条件:\n";
      Object.entries(bucket.by).forEach(([key, value]) => {
        response += `  ${key}: ${value}\n`;
      });
    }

    if (bucket.compute && Object.keys(bucket.compute).length > 0) {
      response += "集計値:\n";
      Object.entries(bucket.compute).forEach(([key, value]) => {
        response += `  ${key}: ${value}\n`;
      });
    }

    response += "\n";
  });

  if (result.warnings && result.warnings.length > 0) {
    response += "\n警告:\n";
    result.warnings.forEach((warning) => {
      if (warning.title) response += `- ${warning.title}\n`;
      if (warning.detail) response += `  詳細: ${warning.detail}\n`;
      if (warning.code) response += `  コード: ${warning.code}\n`;
    });
  }

  return response;
};

export const aggregateSpansHandler = async (
  parameters: z.infer<typeof aggregateSpansZodSchema>
): Promise<ToolResponse> => {
  const validation = aggregateSpansZodSchema.safeParse(parameters);
  if (!validation.success) {
    return createErrorResponse(
      `パラメータ検証エラー: ${validation.error.message}`
    );
  }

  const { query, aggregation, startTime, endTime, interval, groupBy } =
    validation.data;

  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const startDate = parseDate(startTime, fifteenMinutesAgo);
  const endDate = parseDate(endTime, now);

  try {
    const result = await aggregateSpans({
      query: query || "*",
      aggregation: aggregation || "count",
      interval: interval || "5m",
      startTime: startDate,
      endTime: endDate,
      groupBy,
    });

    const formattedResult = formatAggregationResult(result);

    return createSuccessResponse([
      formattedResult,
      "生データ: " + JSON.stringify(result, null, 2),
    ]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      `Spanの集計中にエラーが発生しました: ${errorMessage}`
    );
  }
};
