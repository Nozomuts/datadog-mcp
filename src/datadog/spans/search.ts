import { createConfiguration } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-common/configuration.js";
import { Span, SpanSearchParams } from "../../types.js";
import { v2 } from "@datadog/datadog-api-client";

export type SearchSpansResult = {
  spans: Span[];
  nextCursor?: string;
};

export const searchSpans = async (
  params: SpanSearchParams
): Promise<SearchSpansResult> => {
  try {
    const configuration = createConfiguration();
    const spansApi = new v2.SpansApi(configuration);

    const response = await spansApi.listSpansGet({
      filterQuery: params.filterQuery,
      filterFrom: params.filterFrom.toISOString(),
      filterTo: params.filterTo.toISOString(),
      pageLimit: params.pageLimit || 25,
      pageCursor: params.pageCursor,
    });

    if (!response.data || response.data.length === 0) {
      return { spans: [] };
    }

    const spans = response.data.map((spanData) => ({
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
    }));
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
