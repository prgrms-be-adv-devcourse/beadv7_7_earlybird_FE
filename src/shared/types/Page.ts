/** 서버 PageResponse<T>와 1:1. page는 0-based다. */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}
