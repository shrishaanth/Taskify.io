import { Request, Response, NextFunction } from 'express';

export interface PaginationParams {
  cursor?: string;
  limit: number;
  sort: Record<string, 1 | -1>;
}

const DEFAULT_SORT: Record<string, 1 | -1> = { createdAt: -1 };

/**
 * Parses cursor-based pagination params from query string.
 * Use on list endpoints that return PaginatedResult.
 */
export function parsePagination(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const sort = parseSortParam(req.query.sort as string | undefined);

  (req as any).pagination = { cursor, limit, sort } as PaginationParams;
  next();
}

function parseSortParam(sort?: string): Record<string, 1 | -1> {
  if (!sort) return DEFAULT_SORT;
  const result: Record<string, 1 | -1> = {};
  for (const part of sort.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('-')) {
      result[trimmed.slice(1)] = -1;
    } else {
      result[trimmed] = 1;
    }
  }
  return Object.keys(result).length > 0 ? result : DEFAULT_SORT;
}

export interface PaginatedResult<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
}

/**
 * Helper to apply cursor pagination to a Mongoose query.
 */
export async function paginateQuery<T>(
  query: Record<string, unknown>,
  pagination: PaginationParams,
  model: { find: (q: any) => any },
  sortField: string = '_id',
): Promise<PaginatedResult<T>> {
  const { cursor, limit, sort } = pagination;

  if (cursor) {
    const sortDir = sort[sortField] || -1;
    query._id = { [sortDir === -1 ? '$lt' : '$gt']: cursor };
  }

  const items = await model
    .find(query)
    .sort(sort)
    .limit(limit + 1) // Fetch one extra to detect hasMore
    .lean()
    .exec();

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  return {
    data: items as unknown as T[],
    cursor: items.length > 0 ? (items[items.length - 1] as any)._id.toString() : null,
    hasMore,
  };
}
