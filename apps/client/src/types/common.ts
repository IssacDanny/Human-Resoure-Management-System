// Common shared API definitions like pagination
export interface PaginationInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface ErrorResponse {
  traceId: string;
  code: string;
  message: string;
  details?: {
    field?: string;
    issue?: string;
  }[];
}
