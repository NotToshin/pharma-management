# Territory assignments

`Territory` is the source of territory names, divisions, and active status. `SystemUser`, `Doctor`, `DoctorVisitLog`, `Staff`, `Client`, `Order`, `DeliveryCollection`, `Wholesaler`, `MioZoneAllocation`, and `TerritoryTarget` have an indexed `territoryId` ObjectId and a `territoryRef` relation. Deleting a referenced master territory is restricted.

IDs are nullable to accommodate existing MongoDB documents and optional doctor/staff assignments. Existing `territory` strings remain canonical display labels for lists, invoices, filters, and exports. They are not independent assignment inputs: `backend/src/services/territoryAssignment.ts` resolves every new assignment to a master record and writes the ID and label together.

## API and forms

- Provisioning (`POST /api/rbac/users`) requires `territoryId`. Operator updates accept `territoryId` and may omit it to preserve the existing assignment. User lists, provisioning, editing, login, and refresh responses include the ID; user/session responses also expose `territoryRef`.
- Other assignment APIs accept `territoryId` or an exact, case-insensitive master name for compatibility with imports and existing forms. An ID takes precedence over a supplied label. Unknown IDs, unknown names, ambiguous names, and newly assigned inactive territories return 400. An existing inactive assignment may be retained.
- Doctor and staff territory assignments are optional. Explicitly clearing them clears both the relation and label. Other new assignments require a master territory, including clients, orders, collections, wholesalers, zones, and targets. An order may inherit its client's assignment.
- Zone allocation writes the master division and synchronizes the staff territory in the same transaction. Territory analytics uses master records and matches linked operations by ID, with exact-name fallback for legacy rows. It no longer invents regions or guesses divisions from text.
- `GET /api/territories` reads master records without seeding or writing. `POST /api/territories` validates the body, requires authentication, and checks the `Target Vs Achievement` create permission. Custom territory entry in the targets screen explicitly creates a master before saving a quota. The normal seed creates or finds the initial administrator's master territory (`SUPERADMIN_TERRITORY`, default `Head Office`).
- `frontend/components/master-territory-select.tsx` and `frontend/hooks/use-territories.ts` supply database choices. Provisioning groups master records by their stored division and submits the chosen ID. No geographic fallback options or assignments are injected when loading fails or the master list is empty.

## Existing MongoDB records

From `backend`, deploy the schema and backfill existing assignments:

```sh
npx prisma generate
npx prisma db push --skip-generate
npm run territories:backfill
npm run territories:backfill -- --apply
```

The first backfill command previews counts without writes. `--apply` creates missing masters from actual stored territory names and links records; it does not merge similarly named territories or guess administrative divisions. A division is carried over from zone allocations only when those records agree. Unassigned placeholders are preserved without creating fake master rows. Duplicate master names and dangling references stop the script. Writes check the original assignment to avoid overwriting concurrent changes. Re-running after completion makes no assignment changes.

The script loads only assignment fields and logs counts; credentials and connection details are never printed. Review master divisions after importing legacy labels. Restart running API processes after regenerating Prisma; Windows may lock the loaded Prisma engine DLL during generation.

Run `npm run test:territories` for the isolated regression suite (it compiles the API and uses database stubs). Run frontend `npm run typecheck` separately.
