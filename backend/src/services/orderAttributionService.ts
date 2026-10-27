import type { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";

export const normalizeAssignment = (value?: string | null) =>
  (value || "").trim().replace(/\s+/g, " ").toLowerCase();

const assignedName = (value?: string | null) => {
  const normalized = normalizeAssignment(value);
  return normalized && !["general mio", "unassigned", "n/a"].includes(normalized)
    ? value?.trim() || null
    : null;
};

export const loadOrderAttributionSources = async (
  db: Prisma.TransactionClient = prisma
) => {
  const [clients, allocations, targets] = await Promise.all([
    db.client.findMany({
      select: { pharmacyName: true, territory: true, assignedMio: true },
    }),
    db.mioZoneAllocation.findMany({
      select: {
        id: true,
        mioName: true,
        employeeId: true,
        phone: true,
        division: true,
        territory: true,
        allocatedZone: true,
      },
    }),
    db.territoryTarget.findMany({
      select: { territory: true, mioName: true },
    }),
  ]);
  return { clients, allocations, targets };
};

type AttributionSources = Awaited<ReturnType<typeof loadOrderAttributionSources>>;

// Explicit order assignments take precedence. Legacy placeholder assignments may
// use a client or a unique territory owner, but must never credit multiple MIOs.
export const resolveOrderMio = (
  order: { assignedMio?: string | null; territory?: string | null; pharmacyName: string },
  sources: AttributionSources
): string | null => {
  const explicit = assignedName(order.assignedMio);
  if (explicit) return explicit;

  const territory = normalizeAssignment(order.territory);
  const uniqueNames = (names: Array<string | null | undefined>) => {
    const result = new Map<string, string>();
    for (const name of names) {
      const assigned = assignedName(name);
      if (assigned) result.set(normalizeAssignment(assigned), assigned);
    }
    return result;
  };
  const onlyName = (names: Map<string, string>) =>
    names.size === 1 ? names.values().next().value ?? null : null;

  const clientOwners = uniqueNames(sources.clients
    .filter((client) =>
      normalizeAssignment(client.pharmacyName) === normalizeAssignment(order.pharmacyName) &&
      (!territory || !client.territory || normalizeAssignment(client.territory) === territory))
    .map((client) => client.assignedMio));
  if (clientOwners.size) return onlyName(clientOwners);
  if (!territory) return null;

  const allocatedOwners = uniqueNames(sources.allocations
    .filter((allocation) => normalizeAssignment(allocation.territory) === territory)
    .map((allocation) => allocation.mioName));
  if (allocatedOwners.size) return onlyName(allocatedOwners);

  return onlyName(uniqueNames(sources.targets
    .filter((target) => normalizeAssignment(target.territory) === territory)
    .map((target) => target.mioName)));
};
