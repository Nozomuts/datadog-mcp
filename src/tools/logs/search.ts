import { z } from "zod";
import { searchLogs } from "../../datadog/logs/search.js";
import { createErrorResponse, createSuccessResponse } from "../../utils.js";
import type { LogSearchResult, ToolResponse } from "../../types.js";

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
  pageCursor: z
    .string()
    .optional()
    .describe("ページネーションのカーソル（オプション）"),
});

const formatLogs = (result: LogSearchResult): string => {
  const { logs, nextCursor } = result;

  if (logs.length === 0) {
    return "該当するログが見つかりませんでした。";
  }

  let response = logs
    .map((log) => {
      const timestamp = log.timestamp
        ? new Date(log.timestamp).toLocaleString("ja-JP")
        : "日時不明";

      return `[${timestamp}] ${log.service || "不明"} - ${
        log.host || "不明"
      }: ${log.message || "メッセージなし"}`;
    })
    .join("\n\n");

  if (nextCursor) {
    response += `\n\n次のページを取得するには cursor="${nextCursor}" を指定してください。`;
  }

  return response;
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
    const result = await searchLogs(validation.data);

    const summaryText = generateSummaryText(
      validation.data.filterQuery,
      validation.data.filterFrom,
      validation.data.filterTo,
      result.logs.length
    );
    const formattedLogs = formatLogs(result);

    return createSuccessResponse([
      summaryText,
      formattedLogs,
      "詳細なログデータ:",
      JSON.stringify(result.logs, null, 2),
    ]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`ログ検索エラー: ${errorMessage}`);
  }
};
