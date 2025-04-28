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
    .describe("取得するログの最大数（オプション、デフォルトは25）"),
  pageCursor: z
    .string()
    .optional()
    .describe("次のページを取得するためのカーソル（オプション）"),
});

// ログの重要な情報を抽出して簡潔な表示を生成する関数
const formatLogSummary = (log: Log): string => {
  const timestamp = log.timestamp
    ? new Date(log.timestamp).toLocaleString()
    : "不明な日時";
  const service = log.service || "不明なサービス";
  const status = log.status || "不明なステータス";
  const message = log.message || "メッセージなし";

  return `[${timestamp}] ${service} - ${status} - ${message.slice(0, 500)}${
    message.length > 500 ? "..." : ""
  }`;
};

const generateSummaryText = (
  query: string | undefined,
  startDate: Date,
  endDate: Date,
  logs: Log[],
  nextCursor?: string
): string => {
  // 検索条件の概要
  const searchSummary = `# ログ検索結果\n\n## 検索条件\n* **クエリ:** \`${
    query || "*"
  }\`\n* **期間:** ${startDate.toLocaleString()} から ${endDate.toLocaleString()}\n* **取得件数:** ${
    logs.length
  }件${logs.length === 0 ? " (該当するログはありませんでした)" : ""}\n`;

  // 次のページ情報
  const paginationInfo = nextCursor
    ? `\n## ページング\n* **次のページカーソル:** \`${nextCursor}\`\n`
    : "";

  // ログのサマリー表示
  const logSummaries =
    logs.length === 0
      ? ""
      : `\n## ログサマリー\n${logs
          .map(
            (log, index) =>
              `### [${index + 1}] ${
                log.service || "不明なサービス"
              }\n${formatLogSummary(log)}\n`
          )
          .join("\n")}`;

  return `${searchSummary}${paginationInfo}${logSummaries}`;
};

export const searchLogsHandler = async (
  parameters: z.infer<typeof searchLogsZodSchema>
): Promise<ToolResponse> => {
  const validation = searchLogsZodSchema.safeParse(parameters);
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

    const result = await searchLogs(validatedParams);

    const summaryText = generateSummaryText(
      validatedParams.filterQuery,
      validatedParams.filterFrom,
      validatedParams.filterTo,
      result.logs,
      result.nextCursor
    );

    return createSuccessResponse([summaryText]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`ログ検索エラー: ${errorMessage}`);
  }
};
