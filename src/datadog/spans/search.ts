// filepath: /Users/nozomu.tsuruta/dd-mcp/src/datadog/spans/search.ts
import { createConfiguration } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-common/configuration.js";
import { Span, SpanSearchParams } from "../../types.js";
import { v2 } from "@datadog/datadog-api-client";
import { SpansApiListSpansGetRequest } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v2/index.js";

const buildSearchParams = (
  params?: SpanSearchParams
): SpansApiListSpansGetRequest => {
  const now = new Date();
  const fifteenMinutesAgo = new Date(now);
  fifteenMinutesAgo.setMinutes(now.getMinutes() - 15);

  const startTime = params?.startTime ?? fifteenMinutesAgo;
  const endTime = params?.endTime ?? now;

  return {
    filterQuery: params?.query || "*",
    pageLimit: params?.limit ?? 25,
    filterFrom: startTime.toISOString(),
    filterTo: endTime.toISOString(),
    pageCursor: params?.cursor,
  };
};

const transformSpanData = (spanData: v2.Span): Span => ({
  id: spanData.id || "",
  traceId: spanData.attributes?.traceId,
  spanId: spanData.attributes?.spanId,
  parentId: spanData.attributes?.parentId,
  service: spanData.attributes?.service,
  resource: spanData.attributes?.resourceName,
  host: spanData.attributes?.host,
  env: spanData.attributes?.env,
  startTimestamp: spanData.attributes?.startTimestamp?.toISOString(),
  endTimestamp: spanData.attributes?.endTimestamp?.toISOString(),
  duration: spanData.attributes?.attributes?.duration,
  type: spanData.attributes?.type,
  tags: spanData.attributes?.tags || [],
  attributes: spanData.attributes?.attributes || {},
});

export type SearchSpansResult = {
  spans: Span[];
  nextCursor?: string;
};

export const searchSpans = async (
  params?: SpanSearchParams
): Promise<SearchSpansResult> => {
  try {
    const configuration = createConfiguration();
    const spansApi = new v2.SpansApi(configuration);
    const searchParams = buildSearchParams(params);

    const response = await spansApi.listSpansGet(searchParams);

    if (!response.data || response.data.length === 0) {
      return { spans: [] };
    }

    const spans = response.data.map(transformSpanData);
    const nextCursor = response.meta?.page?.after;

    return {
      spans,
      nextCursor,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error searching spans: ${errorMessage}`);
    throw new Error(`Datadog API error: ${errorMessage}`);
  }
};
