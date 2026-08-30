import { z } from "zod";

/** Query schema for `?page=&limit=` list endpoints. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PageInfo {
  page: number;
  limit: number;
  skip: number;
}

export function toPageInfo(q: PaginationQuery): PageInfo {
  return { page: q.page, limit: q.limit, skip: (q.page - 1) * q.limit };
}
