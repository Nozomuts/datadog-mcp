import { client } from "@datadog/datadog-api-client";

export const createConfiguration = () => {
  return client.createConfiguration({
    authMethods: {
      apiKeyAuth: process.env.DD_API_KEY || "",
      appKeyAuth: process.env.DD_APP_KEY || "",
    },
  });
};
