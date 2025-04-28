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
    .describe("結果をグループ化する時間間隔（オプション、デフォルト '5m'）"),
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
  const searchSummary = `# Span集計結果\n\n## 集計条件\n* **クエリ:** \`${
    query || "*"
  }\`\n* **期間:** ${startDate.toLocaleString()} から ${endDate.toLocaleString()}\n* **グループ化:** ${
    groupBy?.join(", ") || "なし"
  }\n* **集計関数:** ${aggregation}\n`;

  const statusSummary = `\n## ステータス\n* **ステータス:** ${
    result.status || "不明"
  }\n* **経過時間:** ${result.elapsed || "不明"}\n`;

  const bucketsSummary =
    result.buckets.length === 0
      ? "該当するスパンはありませんでした。"
      : result.buckets
          .map((bucket) => {
            const groupByValues = Object.entries(bucket.by || {})
              .map(([key, value]) => `${key}: ${value}`)
              .join(", ");
            const computeValues = Object.entries(bucket.compute || {})
              .map(([key, value]) => `${key}: ${value}`)
              .join(", ");
            return `### グループ化: ${groupByValues}\n* **集計結果:** ${computeValues}\n`;
          })
          .join("\n");

  const warningsSummary =
    result.warnings?.length === 0
      ? ""
      : `\n## 警告\n${result.warnings
          ?.map((warning) => {
            const title = warning.title || "";
            const detail = warning.detail || "";
            const code = warning.code || "";
            return `### ${title}\n* **詳細:** ${detail}\n* **コード:** ${code}\n`;
          })
          .join("\n")}`;

  return `${searchSummary}${statusSummary}${bucketsSummary}${warningsSummary}`;
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
