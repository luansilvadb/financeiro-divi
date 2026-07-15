export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  totalPages: number
}
