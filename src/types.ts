// 共通型定義

// Datadogのログ応答型定義
export type Log = {
  id: string;
  host?: string;
  service?: string;
  status?: string;
  timestamp?: string;
  tags?: string[];
  attributes?: Record<string, any>;
  message?: string;
};

// Datadog API リクエストパラメータ型定義
export type LogSearchParams = {
  query?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  sort?: "asc" | "desc";
  index?: string;
};

// ツールレスポンス型定義
export type ToolResponse = {
  content: {
    type: "text";
    text: string;
  }[];
  isError: boolean;
};
