import { client, v2 } from "@datadog/datadog-api-client";
import { Log, LogSearchParams } from "./types.js";
import { LogsApiListLogsGetRequest } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v2/index.js";

type ApiConfig = {
  apiKey: string;
  appKey: string;
};

const createConfiguration = (config?: ApiConfig) => {
  return client.createConfiguration({
    authMethods: {
      apiKeyAuth: config?.apiKey || process.env.DD_API_KEY || "",
      appKeyAuth: config?.appKey || process.env.DD_APP_KEY || "",
    },
  });
};

const buildSearchParams = (
  params?: LogSearchParams
): LogsApiListLogsGetRequest => {
  const now = new Date();
  const oneHourAgo = new Date(now);
  oneHourAgo.setHours(now.getHours() - 1);

  const startTime = params?.startTime ?? oneHourAgo;
  const endTime = params?.endTime ?? now;
  const sort = params?.sort === "asc" ? "timestamp" : "-timestamp";

  return {
    filterQuery: params?.query || "*",
    pageLimit: params?.limit ?? 25,
    filterFrom: startTime,
    filterTo: endTime,
    sort,
  };
};

const transformLogData = (logData: v2.Log): Log => ({
  id: logData.id || "",
  host: logData.attributes?.host,
  service: logData.attributes?.service,
  status: logData.attributes?.status,
  timestamp: logData.attributes?.timestamp
    ? new Date(logData.attributes.timestamp).toISOString()
    : undefined,
  tags: logData.attributes?.tags || [],
  attributes: logData.attributes || {},
  message: logData.attributes?.message,
});

export const searchLogs = async (params?: LogSearchParams): Promise<Log[]> => {
  try {
    const configuration = createConfiguration();
    const logsApi = new v2.LogsApi(configuration);
    const searchParams = buildSearchParams(params);

    const response = await logsApi.listLogsGet(searchParams);

    if (!response.data || response.data.length === 0) {
      return [];
    }

    return response.data.map(transformLogData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error searching logs: ${errorMessage}`);
    throw new Error(`Datadog API error: ${errorMessage}`);
  }
};
