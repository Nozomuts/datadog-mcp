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
