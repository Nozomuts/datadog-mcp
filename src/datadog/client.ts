import { client, v2 } from "@datadog/datadog-api-client";
import { Log, LogSearchParams } from "./types.js";

// Datadog API設定
const createConfiguration = () => {
  return client.createConfiguration({
    authMethods: {
      apiKeyAuth: process.env.DD_API_KEY || "",
      appKeyAuth: process.env.DD_APP_KEY || "",
    },
  });
};

// ログの検索
export const searchLogs = async (params?: LogSearchParams): Promise<Log[]> => {
  try {
    const configuration = createConfiguration();
    const logsApi = new v2.LogsApi(configuration);

    const now = Math.floor(Date.now() / 1000);
    const defaultEndTime = now;
    const defaultStartTime = now - 3600; // デフォルトは過去1時間

    const startTime = params?.startTime ?? defaultStartTime;
    const endTime = params?.endTime ?? defaultEndTime;

    // 検索APIパラメータの構築
    const searchParams = {
      filterQuery: params?.query || "*",
      pageLimit: params?.limit ?? 25,
      startAt: startTime * 1000,
      endAt: endTime * 1000,
    };

    const response = await logsApi.listLogsGet(searchParams);

    if (!response.data || response.data.length === 0) {
      return [];
    }

    return response.data.map((log) => ({
      id: log.id || "",
      host: log.attributes?.host,
      service: log.attributes?.service,
      status: log.attributes?.status,
      timestamp: log.attributes?.timestamp
        ? new Date(log.attributes.timestamp).toISOString()
        : undefined,
      tags: log.attributes?.tags || [],
      attributes: log.attributes || {},
      message: log.attributes?.message,
    }));
  } catch (error) {
    console.error("Error searching logs:", error);
    throw new Error(`Datadog API error: ${error}`);
  }
};
