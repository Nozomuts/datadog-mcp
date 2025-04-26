import type { ToolResponse } from "./types.js";

/**
 * エラーレスポンスを作成する汎用関数
 * @param message エラーメッセージ
 * @returns ToolResponse形式のエラーレスポンス
 */
export const createErrorResponse = (message: string): ToolResponse => ({
  content: [
    {
      type: "text",
      text: message,
    },
  ],
  isError: true,
});

/**
 * 成功レスポンスを作成する汎用関数
 * @param texts レスポンスに含めるテキストの配列
 * @returns ToolResponse形式の成功レスポンス
 */
export const createSuccessResponse = (texts: string[]): ToolResponse => ({
  content: texts.map((text) => ({ type: "text", text })),
  isError: false,
});

/**
 * UNIXタイムスタンプをDateオブジェクトに変換する汎用関数
 * @param timestamp UNIXタイムスタンプ（秒）
 * @param defaultDate デフォルトの日付（無効な場合に使用）
 * @returns Dateオブジェクト
 */
export const parseDate = (
  timestamp: number | undefined,
  defaultDate: Date
): Date => {
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
