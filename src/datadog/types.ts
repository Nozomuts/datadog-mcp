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

export type LogSearchResponse = {
  status: string;
  logs: Log[];
};

// Datadog API リクエストパラメータ型定義
export type LogSearchParams = {
  query?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  sort?: "asc" | "desc";
  index?: string;
};
