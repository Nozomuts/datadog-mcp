// filepath: /Users/nozomu.tsuruta/dd-mcp/src/datadog/spans/aggregate.ts
import { createConfiguration } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-common/configuration.js";
import {
  SpanAggregationParams,
  SpanAggregationResult,
  SpanBucket,
} from "../../types.js";
import { v2 } from "@datadog/datadog-api-client";
import { SpansAggregationFunction } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v2/index.js";

export const aggregateSpans = async (
  params?: SpanAggregationParams
): Promise<SpanAggregationResult> => {
  try {
    const configuration = createConfiguration();
    const spansApi = new v2.SpansApi(configuration);

    const now = new Date();
    const fifteenMinutesAgo = new Date(now);
    fifteenMinutesAgo.setMinutes(now.getMinutes() - 15);

    const startTime = params?.startTime ?? fifteenMinutesAgo;
    const endTime = params?.endTime ?? now;
    const aggregation =
      (params?.aggregation as SpansAggregationFunction) ?? "count";
    const interval = params?.interval ?? "5m";

    const requestBody: v2.SpansApiAggregateSpansRequest = {
      body: {
        data: {
          attributes: {
            compute: [
              {
                aggregation: aggregation,
                interval: interval,
                type: "timeseries",
              },
            ],
            filter: {
              from: startTime.toISOString(),
              to: endTime.toISOString(),
              query: params?.query || "*",
            },
            groupBy: params?.groupBy?.length
              ? params.groupBy.map((field) => ({
                  facet: field,
                  limit: 10,
                }))
              : undefined,
          },
          type: "aggregate_request",
        },
      },
    };

    const response = await spansApi.aggregateSpans(requestBody);

    if (!response.data || response.data.length === 0) {
      return { buckets: [] };
    }

    const buckets: SpanBucket[] = response.data.map((bucket) => ({
      id: bucket.id || "",
      by: bucket.attributes?.by || {},
      compute: bucket.attributes?.compute || {},
      computes: bucket.attributes?.computes
        ? Object.fromEntries(
            Object.entries(bucket.attributes.computes).map(([key, value]) => [
              key,
              {
                description: String(value),
                type: typeof value,
              },
            ])
          )
        : {},
    }));

    return {
      buckets,
      elapsed: response.meta?.elapsed,
      requestId: response.meta?.requestId,
      status: response.meta?.status?.toString(),
      warnings: response.meta?.warnings?.map((warning) => ({
        code: warning.code,
        detail: warning.detail,
        title: warning.title,
      })),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error aggregating spans: ${errorMessage}`);
    throw new Error(`Datadog API error: ${errorMessage}`);
  }
};
