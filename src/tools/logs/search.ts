import { z } from "zod";
import { searchLogs } from "../../datadog/logs/search.js";
import { createErrorResponse, createSuccessResponse } from "../../utils.js";
import type { Log, ToolResponse } from "../../types.js";

export const searchLogsZodSchema = z.object({
  query: z
    .string()
    .optional()
    .describe(
      "ログを検索するためのクエリ文字列（オプション、デフォルトは「*」）"
    ),
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
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("取得するログの最大数（オプション、デフォルトは25）"),
  sort: z
    .enum(["asc", "desc"])
    .optional()
    .describe(
      "ソート順（asc=古い順、desc=新しい順、オプション、デフォルトはdesc）"
    ),
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

const parseDate = (timestamp: number | undefined, defaultDate: Date): Date => {
  if (!timestamp) return defaultDate;

  try {
    // UNIXタイムスタンプ（秒）をミリ秒に変換して日付オブジェクトを作成
    const date = new Date(timestamp * 1000);
    // 無効な日付の場合はNaNが返されるので、それを検出
    return isNaN(date.getTime()) ? defaultDate : date;
  } catch (e) {
    return defaultDate;
  }
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

  const { query, startTime, endTime, limit, sort } = validation.data;

  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const startDate = parseDate(startTime, fifteenMinutesAgo);
  const endDate = parseDate(endTime, now);

  try {
    const logs = await searchLogs({
      query: query || "*",
      startTime: startDate,
      endTime: endDate,
      limit: limit || 25,
      sort: sort || "desc",
    });

    const summaryText = generateSummaryText(
      query,
      startDate,
      endDate,
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
