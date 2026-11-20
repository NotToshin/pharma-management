import prisma from "./prisma";

/**
 * Returns the next sequential reference code for a journal prefix.
 *
 * Existing numeric suffixes are inspected so deleting an older journal row
 * does not cause the next code to be reused. Non-numeric legacy suffixes
 * (for example `JRN-SPAY-MVQ85E56`) are ignored.
 *
 * Example: `nextJournalRef("JRN-SPAY-")` -> `JRN-SPAY-001`.
 */
export async function nextJournalRef(
  prefix: string,
  client: any = prisma,
  padLength = 3
): Promise<string> {
  const rows: Array<{ refCode: string }> = await client.journalTransaction.findMany({
    where: { refCode: { startsWith: prefix } },
    select: { refCode: true },
  });

  let max = 0;
  for (const row of rows) {
    const suffix = row.refCode.slice(prefix.length);
    if (/^\d+$/.test(suffix)) {
      max = Math.max(max, Number(suffix));
    }
  }

  return `${prefix}${String(max + 1).padStart(padLength, "0")}`;
}
