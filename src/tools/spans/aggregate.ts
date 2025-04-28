import { z } from "zod";
import { aggregateSpans } from "../../datadog/spans/aggregate.js";
import { createSuccessResponse, createErrorResponse } from "../../utils.js";
import type { SpanAggregationResult, ToolResponse } from "../../types.js";

export const aggregateSpansZodSchema = z.object({
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
  groupBy: z
    .array(z.string())
    .optional()
    .describe("グループ化するための属性（例: ['service', 'resource_name']）"),
  aggregation: z
    .enum(["count", "avg", "sum", "min", "max", "pct"])
    .default("count")
    .describe("集計関数（オプション、デフォルトは「count」）"),
  interval: z
    .string()
    .optional()
    .default("5m")
    .describe("結果をグループ化する時間間隔（オプション、デフォルト 「5m」）"),
  type: z
    .enum(["timeseries", "total"])
    .default("timeseries")
    .describe(
      "結果タイプ - timeseries または total（オプション、デフォルトは「timeseries」）"
    ),
});

const generateSummaryText = (
  query: string | undefined,
  startDate: Date,
  endDate: Date,
  groupBy: string[] | undefined,
  aggregation: string,
  result: SpanAggregationResult
): string => {
  let responseText = "";
  // 集計条件のセクションを追加
  responseText += `# Span集計結果\n`;
  responseText += `## 集計条件\n`;
  responseText += `* クエリ: \`${query || "*"}\`\n`;
  responseText += `* 期間: ${startDate.toLocaleString()} から ${endDate.toLocaleString()}\n`;
  responseText += `* グループ化: ${groupBy?.join(", ") || "なし"}\n`;
  responseText += `* 集計関数: ${aggregation}\n`;

  if (result.status) {
    responseText += `## ステータス\n`;
    responseText += `* ステータス: ${result.status || "不明"}\n`;
    responseText += `* 経過時間: ${result.elapsed || "不明"}\n`;
  }

  if (result.buckets.length > 0) {
    responseText += `## 集計結果\n`;
    for (const bucket of result.buckets) {
      responseText += `### グループ\n`;
      for (const [key, value] of Object.entries(bucket.by || {})) {
        responseText += `* ${key}: ${value}\n`;
      }
      for (const value of Object.values(bucket.compute || {})) {
        for (const item of value || []) {
          if ("value" in item && "time" in item) {
            responseText += `* 集計値: ${item.value}, 時間: ${item.time}\n`;
          }
        }
      }
    }
  }

  if (result.warnings && result.warnings.length > 0) {
    responseText += `## 警告\n`;
    for (const warning of result.warnings) {
      responseText += `### 詳細\n`;
      if (warning.title) {
        responseText += `* タイトル: ${warning.title}\n`;
      }
      if (warning.detail) {
        responseText += `* 詳細: ${warning.detail}\n`;
      }
      if (warning.code) {
        responseText += `* コード: ${warning.code}\n`;
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

    const result = await aggregateSpans(validatedParams);
    const formattedResult = generateSummaryText(
      validation.data.filterQuery,
      validatedParams.filterFrom,
      validatedParams.filterTo,
      validatedParams.groupBy,
      validation.data.aggregation,
      result
    );
    return createSuccessResponse([formattedResult]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`スパン集計エラー: ${errorMessage}`);
  }
};
