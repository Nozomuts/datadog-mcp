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

const generateSummaryText = (
  query: string | undefined,
  startDate: Date,
  endDate: Date,
  logs: Log[],
  nextCursor?: string
): string => {
  let responseText = "";

  responseText += "# ログ検索結果\n\n";
  responseText += "## 検索条件\n";
  responseText += `* クエリ: \`${query || "*"}\`\n`;
  responseText += `* 期間: ${startDate.toLocaleString()} から ${endDate.toLocaleString()}\n`;
  responseText += `* 取得件数: ${logs.length}件`;

  if (logs.length === 0) {
    return responseText;
  }

  if (nextCursor) {
    responseText += "\n## ページング\n";
    responseText += `* 次のページカーソル: \`${nextCursor}\`\n`;
  }

  responseText += "\n## ログサマリー\n";
  const MAX_MESSAGE_LENGTH = 300;
  for (const [index, log] of logs.entries()) {
    responseText += `\n### [${index + 1}]`;
    if (log.service) {
      responseText += `* サービス: ${log.service}\n`;
    }
    if (log.tags && log.tags.length > 0) {
      responseText += `* タグ: ${log.tags.join(", ")}\n`;
    }
    if (log.timestamp) {
      responseText += `* 時刻: ${new Date(
        log.timestamp
      ).toLocaleString()}\n`;
    }
    if (log.status) {
      responseText += `* ステータス: ${log.status}\n`;
    }
    if (log.message) {
      responseText += `* メッセージ: ${log.message.slice(
        0,
        MAX_MESSAGE_LENGTH
      )}${log.message.length > MAX_MESSAGE_LENGTH ? "..." : ""}\n`;
    }
    if (log.host) {
      responseText += `* ホスト: ${log.host}\n`;
    }

    responseText += `\n#### 重要な属性\n`;
    for (const key of [
      "http.method",
      "http.url",
      "http.status_code",
      "error",
    ]) {
      if (log.attributes && key in log.attributes) {
        responseText += `* ${key}: \`${JSON.stringify(
          log.attributes[key]
        )}\`\n`;
      }
    }
  }

  return responseText;
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
