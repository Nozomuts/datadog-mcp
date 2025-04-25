import { client } from "@datadog/datadog-api-client";

type ApiConfig = {
  apiKey: string;
  appKey: string;
};

export const createConfiguration = (config?: ApiConfig) => {
  return client.createConfiguration({
    authMethods: {
      apiKeyAuth: config?.apiKey || process.env.DD_API_KEY || "",
      appKeyAuth: config?.appKey || process.env.DD_APP_KEY || "",
    },
  });
};
