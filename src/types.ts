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

export type LogSearchParams = {
  filterQuery: string;
  filterFrom: Date;
  filterTo: Date;
  pageLimit: number;
};

export type Span = {
  id: string;
  traceId?: string;
  spanId?: string;
  parentId?: string;
  service?: string;
  resource?: string;
  host?: string;
  env?: string;
  startTimestamp?: string;
  endTimestamp?: string;
  duration?: number;
  type?: string;
  tags?: string[];
  attributes?: Record<string, any>;
};

export type SpanSearchParams = {
  filterQuery: string;
  filterFrom: Date;
  filterTo: Date;
  pageLimit: number;
  pageCursor?: string;
};

export type SpanSearchResult = {
  spans: Span[];
  nextCursor?: string;
};

export type SpanAggregationParams = {
  filterQuery: string;
  filterFrom: Date;
  filterTo: Date;
  groupBy?: string[];
  aggregation: string;
  interval: string;
};


export type SpanAggregationResult = {
  buckets: SpanBucket[];
  elapsed?: number;
  requestId?: string;
  status?: string;
  warnings?: SpanWarning[];
};

export type SpanBucket = {
  id: string;
  by?: Record<string, string>;
  compute?: Record<string, any>;
  computes?: Record<string, { description?: string; type?: string }>;
};

export type SpanWarning = {
  code?: string;
  detail?: string;
  title?: string;
};

export type ToolResponse = {
  content: {
    type: "text";
    text: string;
  }[];
  isError: boolean;
};
