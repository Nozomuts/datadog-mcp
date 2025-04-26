import { z } from "zod";
import { searchLogs } from "../../datadog/logs/search.js";
import { createErrorResponse, createSuccessResponse } from "../../utils.js";
import type { Log, ToolResponse } from "../../types.js";

export const searchLogsZodSchema = z.object({
  filterQuery: z
    .string()
    .optional()
    .default("*")
    .describe(
      "ログを検索するためのクエリ文字列（オプション、デフォルトは「*」）"
    ),
  filterFrom: z
    .number()
    .optional()
    .default(Date.now() / 1000 - 15 * 60)
    .describe(
      "検索開始時間（UNIXタイムスタンプ、秒単位、オプション、デフォルトは15分前）"
    )
    .transform((date) => new Date(date * 1000)),
  filterTo: z
    .number()
    .optional()
    .default(Date.now() / 1000)
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
    .describe("取得するログの最大数（オプション、デフォルトは25）"),
});

const formatLogs = (logs: Log[]): string => {
  return logs
    .map((log) => {
      const timestamp = log.timestamp
        ? new Date(log.timestamp).toLocaleString("ja-JP")
        : "日時不明";

      return `[${timestamp}] ${log.service || "不明"} - ${
        log.host || "不明"
      }: ${log.message || "メッセージなし"}`;
    })
    .join("\n\n");
};

const generateSummaryText = (
  query: string | undefined,
  startDate: Date,
  endDate: Date,
  logsCount: number
): string => {
  return `クエリ: ${query || "*"}\n検索期間: ${startDate.toLocaleString(
    "ja-JP"
  )} から ${endDate.toLocaleString("ja-JP")}\n取得件数: ${logsCount}`;
};

export const searchLogsHandler = async (
  parameters: unknown
): Promise<ToolResponse> => {
  const validation = searchLogsZodSchema.safeParse(parameters);
  if (!validation.success) {
    return createErrorResponse(
      `パラメータ検証エラー: ${validation.error.message}`
    );
  }

  try {
    const logs = await searchLogs(validation.data);

    const summaryText = generateSummaryText(
      validation.data.filterQuery,
      validation.data.filterFrom,
      validation.data.filterTo,
      logs.length
    );
    const formattedLogs = formatLogs(logs);

    return createSuccessResponse([
      summaryText,
      formattedLogs || "該当するログが見つかりませんでした。",
      "詳細なログデータ:",
      JSON.stringify(logs, null, 2),
    ]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`ログ検索エラー: ${errorMessage}`);
  }
};
