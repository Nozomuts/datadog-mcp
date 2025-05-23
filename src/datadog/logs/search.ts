import { createConfiguration } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-common/configuration.js";
import { Log, LogSearchParams, LogSearchResult } from "../../types.js";
import { v2 } from "@datadog/datadog-api-client";

export const searchLogs = async (
  params: LogSearchParams
): Promise<LogSearchResult> => {
  try {
    const configuration = createConfiguration();
    const logsApi = new v2.LogsApi(configuration);

    const response = await logsApi.listLogsGet(params);

    if (!response.data || response.data.length === 0) {
      return { logs: [] };
    }

    const logs = response.data.map((logData) => ({
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
    }));
    const nextCursor = response.meta?.page?.after;

    return {
      logs,
      nextCursor,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error searching logs: ${errorMessage}`);
    throw new Error(`Datadog API error: ${errorMessage}`);
  }
};
