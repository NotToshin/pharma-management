import { z } from "zod";

/**
 * Query schema for the financial overview endpoint.
 * `year` and `month` drive the KPI/trend aggregations, while the remaining
 * keys paginate, filter, and sort the recent-transactions ledger returned
 * inside the overview payload.
 */
export const queryFinanceOverviewSchema = z.object({
  query: z.object({
    year: z.string().optional(),
    month: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    search: z.string().optional(),
    searchTerm: z.string().optional(),
    type: z.string().optional(),
  }).optional(),
});

export type QueryFinanceOverviewInput = z.infer<typeof queryFinanceOverviewSchema>["query"];
