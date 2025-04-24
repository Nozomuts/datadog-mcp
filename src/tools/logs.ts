import { z } from "zod";
import { searchLogs } from "../datadog/client.js";

// ログ検索ツールのZodスキーマ定義
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
      "検索開始時間（UNIXタイムスタンプ、秒単位、オプション、デフォルトは1時間前）"
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

// ログ検索ツールの実装
export const searchLogsHandler = async (parameters: unknown) => {
  // パラメータのバリデーション
  const validation = searchLogsZodSchema.safeParse(parameters);

  if (!validation.success) {
    return {
      content: [
        {
          type: "text",
          text: `パラメータ検証エラー: ${validation.error.message}`,
        },
      ],
      isError: true,
    };
  }

  const { query, startTime, endTime, limit, sort } = validation.data;

  try {
    const logs = await searchLogs({ query, startTime, endTime, limit, sort });

    // 現在時刻とデフォルトの開始時間を計算（表示用）
    const now = Math.floor(Date.now() / 1000);
    const actualStartTime = startTime || now - 3600;
    const actualEndTime = endTime || now;

    // 時間範囲の人間が読める形式の文字列を生成
    const formatTime = (timestamp: number) => {
      return new Date(timestamp * 1000).toLocaleString("ja-JP");
    };

    const timeRangeText = `検索期間: ${formatTime(
      actualStartTime
    )} から ${formatTime(actualEndTime)}`;

    // 検索結果のサマリーを作成
    const summaryText = `クエリ: ${query || "*"}\n${timeRangeText}\n取得件数: ${
      logs.length
    }`;

    // ログを整形して表示
    const logsFormatted = logs
      .map((log) => {
        const timestamp = log.timestamp
          ? new Date(log.timestamp).toLocaleString("ja-JP")
          : "日時不明";

        return `[${timestamp}] ${log.service || "不明"} - ${
          log.host || "不明"
        }: ${log.message || "メッセージなし"}`;
      })
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: summaryText,
        },
        {
          type: "text",
          text: logsFormatted || "該当するログが見つかりませんでした。",
        },
        {
          type: "text",
          text: "詳細なログデータ:",
        },
        {
          type: "text",
          text: JSON.stringify(logs, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `ログ検索エラー: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
};
