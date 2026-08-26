import { PaginatedResult } from "../models/types";

export function paginate<T>(data: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export function paginationParams(query: Record<string, unknown>) {
  const page     = Math.max(1, parseInt(String(query.page     || 1), 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query.pageSize || 20), 10)));
  const offset   = (page - 1) * pageSize;
  return { page, pageSize, offset };
}
