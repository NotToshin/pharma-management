import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const models = ["systemUser", "doctor", "doctorVisitLog", "staff", "client", "order", "deliveryCollection", "wholesaler", "mioZoneAllocation", "territoryTarget"] as const;
const normalize = (value: string) => value.trim().toLowerCase();
const unassigned = new Set(["", "unassigned", "n/a", "none", "not assigned"]);
type Row = { id: string; territoryId: string | null; territory: string | null; division?: string | null; territoryAndMio?: string; originalTerritory?: string | null };

async function main() {
  const masters = await prisma.territory.findMany();
  const byName = new Map<string, typeof masters[number]>();
  const byId = new Map(masters.map(t => [t.id, t]));
  for (const territory of masters) {
    const key = normalize(territory.name);
    if (byName.has(key)) throw new Error("Duplicate master territory names must be resolved before backfill");
    byName.set(key, territory);
  }

  const sources: Array<{ model: typeof models[number]; rows: Row[] }> = [];
  const newNames = new Map<string, string>();
  const divisions = new Map<string, Set<string>>();
  let updates = 0;
  let unassignedCount = 0;
  for (const model of models) {
    // Select assignment fields only; never load credentials or personnel details.
    const rows: Row[] = await (prisma[model] as any).findMany({ select: {
      id: true, territory: true, territoryId: true,
      ...(model === "doctor" ? { territoryAndMio: true } : {}),
      ...(model === "mioZoneAllocation" ? { division: true } : {}),
    } });
    sources.push({ model, rows });
    for (const row of rows) {
      row.originalTerritory = row.territory;
      if (row.territoryId && !byId.has(row.territoryId)) throw new Error(`Dangling Territory reference in ${model}; repair it before backfill`);
      const legacy = row.territory || (row.territoryAndMio?.startsWith("MIO:") ? "" : row.territoryAndMio?.split(" / ")[0]) || "";
      const name = byId.get(row.territoryId || "")?.name || legacy.trim();
      row.territory = name;
      const key = normalize(name);
      if (unassigned.has(key)) { unassignedCount++; continue; }
      if (row.division?.trim()) {
        const values = divisions.get(key) || new Set<string>();
        values.add(row.division.trim());
        divisions.set(key, values);
      }
      if (!byName.has(key)) newNames.set(key, name);
      if (!row.territoryId) updates++;
    }
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", newTerritories: newNames.size, unlinkedAssignments: updates, unassignedRecords: unassignedCount }));
  if (!apply) return;

  for (const [key, name] of newNames) {
    const candidates = divisions.get(key);
    const division = candidates?.size === 1 ? [...candidates][0] : null;
    const created = await prisma.territory.create({ data: { name, division, status: "Active" } });
    byName.set(key, created);
  }
  let linked = 0;
  for (const { model, rows } of sources) {
    for (const row of rows) {
      const territory = row.territoryId ? byId.get(row.territoryId) : byName.get(normalize(row.territory || ""));
      if (!territory) continue;
      if (row.territoryId === territory.id && row.originalTerritory === territory.name &&
        (model !== "mioZoneAllocation" || row.division === (territory.division || "General Division"))) continue;
      // Conditional update avoids overwriting a concurrent assignment change.
      const result = await (prisma[model] as any).updateMany({
        where: { id: row.id, AND: [
          { OR: [{ territoryId: row.territoryId }, { territoryId: { isSet: false } }] },
          row.originalTerritory === null
            ? { OR: [{ territory: null }, { territory: { isSet: false } }] }
            : { territory: row.originalTerritory },
        ] },
        data: { territoryId: territory.id, territory: territory.name,
          ...(model === "mioZoneAllocation" ? { division: territory.division || "General Division" } : {}),
        },
      });
      linked += result.count;
    }
  }
  console.log(JSON.stringify({ linked, message: "Territory backfill complete; unassigned records were preserved" }));
}

main().catch((error: unknown) => {
  // Database errors may contain connection details; keep output safe.
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message = error instanceof Error && (error.message.startsWith("Duplicate master") || error.message.startsWith("Dangling Territory"))
    ? error.message : "Check database connectivity and generated Prisma client.";
  const validation = error instanceof Error && error.name === "PrismaClientValidationError"
    ? error.message.split("\n").filter(line => /^(Unknown argument|Argument |Invalid value)/.test(line.trim())).join(" ") : "";
  console.error(`Territory backfill failed${/^P\d+$/.test(code) ? ` (${code})` : ""}. ${message} ${validation}`);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
