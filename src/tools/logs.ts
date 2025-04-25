import { z } from "zod";
import { searchLogs } from "../datadog/client.js";
import type { Log, ToolResponse } from "../types.js";

// ログ検索ツールのZodスキーマ定義
export const searchLogsZodSchema = z.object({
  query: z
    .string()
    .optional()
    .describe(
      "ログを検索するためのクエリ文字列（オプション、デフォルトは「*」）"
    ),
  startTime: z
    .string()
    .optional()
    .describe(
      "検索開始時間（ISO形式の日時文字列、例：2025-04-24T10:00:00Z、オプション、デフォルトは1時間前）"
    ),
  endTime: z
    .string()
    .optional()
    .describe(
      "検索終了時間（ISO形式の日時文字列、例：2025-04-24T11:00:00Z、オプション、デフォルトは現在時刻）"
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

// 日付を日本語形式の文字列に変換する関数
const formatDate = (date: Date): string => {
  return date.toLocaleString("ja-JP");
};

// ログを人間が読みやすい形式にフォーマットする関数
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

// 検索結果のサマリーテキストを生成する関数
const generateSummaryText = (
  query: string | undefined,
  startDate: Date,
  endDate: Date,
  logsCount: number
): string => {
  return `クエリ: ${query || "*"}\n検索期間: ${formatDate(
    startDate
  )} から ${formatDate(endDate)}\n取得件数: ${logsCount}`;
};

// 日付文字列をDateオブジェクトに変換する関数（無効な日付の場合はデフォルト値を使用）
const parseDate = (dateString: string | undefined, defaultDate: Date): Date => {
  if (!dateString) return defaultDate;

  try {
    const date = new Date(dateString);
    // 無効な日付の場合はNaNが返されるので、それを検出
    return isNaN(date.getTime()) ? defaultDate : date;
  } catch (e) {
    return defaultDate;
  }
};

// エラーレスポンスを生成する関数
const createErrorResponse = (message: string): ToolResponse => ({
  content: [
    {
      type: "text",
      text: message,
    },
  ],
  isError: true,
});

// 成功レスポンスを生成する関数
const createSuccessResponse = (
  summaryText: string,
  formattedLogs: string,
  rawLogs: Log[]
): ToolResponse => ({
  content: [
    {
      type: "text",
      text: summaryText,
    },
    {
      type: "text",
      text: formattedLogs || "該当するログが見つかりませんでした。",
    },
    {
      type: "text",
      text: "詳細なログデータ:",
    },
    {
      type: "text",
      text: JSON.stringify(rawLogs, null, 2),
    },
  ],
  isError: false,
});

// ログ検索ツールの実装
export const searchLogsHandler = async (
  parameters: unknown
): Promise<ToolResponse> => {
  // パラメータのバリデーション
  const validation = searchLogsZodSchema.safeParse(parameters);

  if (!validation.success) {
    return createErrorResponse(
      `パラメータ検証エラー: ${validation.error.message}`
    );
  }

  const { query, startTime, endTime, limit, sort } = validation.data;

  try {
    // 現在時刻と1時間前のデフォルト値を設定
    const now = new Date();
    const oneHourAgo = new Date(now);
    oneHourAgo.setHours(now.getHours() - 1);

    // 日付文字列をDateオブジェクトに変換
    const startDate = parseDate(startTime, oneHourAgo);
    const endDate = parseDate(endTime, now);

    const logs = await searchLogs({
      query,
      startTime: startDate,
      endTime: endDate,
      limit,
      sort,
    });

    // サマリーテキストとフォーマットされたログを生成
    const summaryText = generateSummaryText(
      query,
      startDate,
      endDate,
      logs.length
    );
    const formattedLogs = formatLogs(logs);

    return createSuccessResponse(summaryText, formattedLogs, logs);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`ログ検索エラー: ${errorMessage}`);
  }
};
