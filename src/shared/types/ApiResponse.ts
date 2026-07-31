export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  errors: ApiFieldError[] | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}
