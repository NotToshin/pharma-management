export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any;
}

export interface ICalculatedPagination {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IPaginatedResult<T> {
  meta: IPaginationMeta;
  data: T;
}

export const paginationFields = ["page", "limit", "sortBy", "sortOrder"] as const;

/**
 * Calculates page, limit, skip, sortBy, and sortOrder from given pagination options.
 */
export const calculatePagination = (
  options?: IPaginationOptions,
  defaultOptions?: Partial<ICalculatedPagination>
): ICalculatedPagination => {
  const page = Math.max(1, Number(options?.page || defaultOptions?.page || 1));
  const rawLimit = options?.limit !== undefined ? Number(options.limit) : defaultOptions?.limit !== undefined ? Number(defaultOptions.limit) : 10;
  const limit = Math.max(0, isNaN(rawLimit) ? 10 : rawLimit);
  const skip = (page - 1) * limit;

  const sortBy = String(options?.sortBy || defaultOptions?.sortBy || "createdAt");
  const sortOrder = (options?.sortOrder === "asc" || defaultOptions?.sortOrder === "asc" ? "asc" : "desc") as "asc" | "desc";

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

/**
 * Generates pagination metadata including total count, total pages, and next/prev status.
 */
export const createPaginationMeta = (
  total: number,
  pagination: { page: number; limit: number }
): IPaginationMeta => {
  const { page, limit } = pagination;
  const totalPage = limit > 0 ? Math.ceil(total / limit) || 1 : 1;

  return {
    page,
    limit: limit > 0 ? limit : total,
    total,
    totalPage,
    hasNextPage: limit > 0 ? page < totalPage : false,
    hasPrevPage: page > 1,
  };
};

export const paginationHelper = {
  calculatePagination,
  createPaginationMeta,
  paginationFields,
};

export default paginationHelper;
