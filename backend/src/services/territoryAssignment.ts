import type { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";
import { AppError } from "../errors";

export interface TerritoryAssignmentInput {
  territoryId?: string | null;
  territory?: string | null;
}

// Names remain an accepted import/legacy API input, but must resolve to a master row.
// Always store the ID and the canonical label together. Reads never create territories.
export async function resolveTerritoryAssignment(
  input: TerritoryAssignmentInput,
  options: { required?: boolean; currentId?: string | null; db?: Prisma.TransactionClient } = {}
): Promise<{ territoryId: string | null; territory: string }> {
  const db = options.db ?? prisma;
  const id = input.territoryId?.trim();
  const name = input.territory?.trim();
  if (!id && !name) {
    if (options.required) throw new AppError("Select a territory from the Territory collection", 400);
    return { territoryId: null, territory: "" };
  }
  if (id && !/^[a-f\d]{24}$/i.test(id)) throw new AppError("Invalid territory ID", 400);
  const matches = id
    ? [await db.territory.findUnique({ where: { id } })].filter((row) => row !== null)
    : await db.territory.findMany({ where: { name: { equals: name, mode: "insensitive" } } });
  if (!matches.length) throw new AppError("Territory does not exist. Select a master territory.", 400);
  if (matches.length !== 1) throw new AppError("Territory name is ambiguous. Select a territory by ID.", 400);
  const territory = matches[0]!;
  if (territory.status !== "Active" && territory.id !== options.currentId) {
    throw new AppError("Selected territory is inactive", 400);
  }
  return { territoryId: territory.id, territory: territory.name };
}

export const hasTerritoryAssignment = (input: TerritoryAssignmentInput) =>
  input.territoryId !== undefined || input.territory !== undefined;

export function doctorTerritoryInput(input: TerritoryAssignmentInput & { territoryAndMio?: string }): TerritoryAssignmentInput {
  if (input.territory !== undefined || input.territoryId !== undefined) return input;
  const combined = input.territoryAndMio?.trim() || "";
  const name = combined.startsWith("MIO:") ? "" : combined.split(" / ")[0].trim();
  return { ...input, territory: ["unassigned", "n/a"].includes(name.toLowerCase()) ? "" : name };
}
