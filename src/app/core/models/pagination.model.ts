export const PAGE_SIZE_DEFAULT = 50;
export const PAGE_SIZE_MAX = 50;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ListCasosParams {
  page?: number;
  pageSize?: number;
  q?: string;
  estado?: string;
  categoria?: string;
  ciudad?: string;
  aseguradora?: string;
  vista?: 'comercial' | 'nos-deben' | '';
  sort?: string;
  sortDir?: 'asc' | 'desc';
}
