import { createConfiguration } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-common/configuration.js";
import {
  SpanAggregationParams,
  SpanAggregationResult,
  SpanBucket,
} from "../../types.js";
import { v2 } from "@datadog/datadog-api-client";

export const aggregateSpans = async (
  params: SpanAggregationParams
): Promise<SpanAggregationResult> => {
  try {
    const configuration = createConfiguration();
    const spansApi = new v2.SpansApi(configuration);

    const { filterFrom, filterTo, filterQuery, aggregation, interval } = params || {};

    const requestBody: v2.SpansApiAggregateSpansRequest = {
      body: {
        data: {
          attributes: {
            compute: [
              {
                aggregation: aggregation as v2.SpansAggregationFunction,
                interval: interval,
                type: "timeseries",
              },
            ],
            filter: {
              from: filterFrom.toISOString(),
              to: filterTo.toISOString(),
              query: filterQuery,
            },
            groupBy: params.groupBy?.length
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
