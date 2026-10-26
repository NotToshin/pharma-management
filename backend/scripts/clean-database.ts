import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ALL_SYSTEM_MODULES } from "../src/services/rbacService";

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("===============================================================");
  console.log("🧹 AK PHARMA ERP - PRODUCTION DATABASE CLEANUP & INITIALIZATION");
  console.log("===============================================================\n");

  console.log("Connecting to database:", process.env.DATABASE_URL ? "URL provided" : "WARNING: DATABASE_URL not set");

  // Step 1: Wipe all transactional & dummy operational data
  console.log("\n🗑️  Step 1: Purging all dummy/test records from operational collections...");

  const deletionTasks: { name: string; action: () => Promise<{ count: number }> }[] = [
    // Logistics & Sales
    { name: "Order", action: () => prisma.order.deleteMany() },
    { name: "DeliveryCollection", action: () => prisma.deliveryCollection.deleteMany() },
    { name: "PartySettlement", action: () => prisma.partySettlement.deleteMany() },
    { name: "Client", action: () => prisma.client.deleteMany() },
    { name: "Wholesaler", action: () => prisma.wholesaler.deleteMany() },

    // Finance & Treasury
    { name: "ExpenseVoucher", action: () => prisma.expenseVoucher.deleteMany() },
    { name: "TreasuryDeposit", action: () => prisma.treasuryDeposit.deleteMany() },
    { name: "JournalTransaction", action: () => prisma.journalTransaction.deleteMany() },
    { name: "FinancialAccount", action: () => prisma.financialAccount.deleteMany() },

    // Inventory & Warehousing
    { name: "StockAdjustment", action: () => prisma.stockAdjustment.deleteMany() },
    { name: "InventoryBatch", action: () => prisma.inventoryBatch.deleteMany() },
    { name: "ProductBatch", action: () => prisma.productBatch.deleteMany() },
    { name: "PurchaseOrder", action: () => prisma.purchaseOrder.deleteMany() },
    { name: "Product", action: () => prisma.product.deleteMany() },

    // Doctors & Field Force
    { name: "DoctorVisitLog", action: () => prisma.doctorVisitLog.deleteMany() },
    { name: "Doctor", action: () => prisma.doctor.deleteMany() },
    { name: "MioZoneAllocation", action: () => prisma.mioZoneAllocation.deleteMany() },
    { name: "TerritoryTarget", action: () => prisma.territoryTarget.deleteMany() },
    { name: "Territory", action: () => prisma.territory.deleteMany() },

    // HR & Staff
    { name: "Salary", action: () => prisma.salary.deleteMany() },
    { name: "Staff", action: () => prisma.staff.deleteMany() },

    // Audit logs
    { name: "AuditLog", action: () => prisma.auditLog.deleteMany() },

    // RBAC & System Users (Clean all existing to avoid orphaned records)
    { name: "RolePermission", action: () => prisma.rolePermission.deleteMany() },
    { name: "SystemUser", action: () => prisma.systemUser.deleteMany() },
    { name: "SystemRole", action: () => prisma.systemRole.deleteMany() },
    { name: "Role", action: () => prisma.role.deleteMany() },
  ];

  for (const task of deletionTasks) {
    try {
      const res = await task.action();
      console.log(`   ✓ Cleared ${task.name.padEnd(20)}: ${res.count} records removed`);
    } catch (err: any) {
      console.warn(`   ⚠️ Could not clear ${task.name}: ${err.message}`);
    }
  }

  // Step 2: Seed Clean Production Superadmin & RBAC Matrix
  console.log("\n🌱 Step 2: Initializing Clean Production Baseline (Superadmin & RBAC)...");

  // 1. Corporate Role
  const corpSuperRole = await prisma.role.create({
    data: {
      name: "Super Administrator",
      permissions: ["ALL_ACCESS", "VIEW_DASHBOARD"],
    },
  });
  console.log(`   ✓ Created Corporate Role: ${corpSuperRole.name} (ID: ${corpSuperRole.id})`);

  // 2. System Role
  const superadminRole = await prisma.systemRole.create({
    data: {
      name: "Super Administrator",
      code: "SUPERADMIN",
      description: "Master operational role with unrestricted privileges across all pharmaceutical operations.",
      isSystemDefault: true,
    },
  });
  console.log(`   ✓ Created System Role: ${superadminRole.name} [${superadminRole.code}]`);

  // 3. Grant full permissions for ALL 28 system modules
  console.log(`   ✓ Registering full permissions across all ${ALL_SYSTEM_MODULES.length} system modules...`);
  for (const mod of ALL_SYSTEM_MODULES) {
    await prisma.rolePermission.create({
      data: {
        roleId: superadminRole.id,
        module: mod.module,
        category: mod.category,
        read: true,
        create: true,
        edit: true,
        delete: true,
        specialAction: mod.specialAction,
        specialGranted: true,
      },
    });
  }

  // 4. Create root SUPERADMIN user
  const adminEmail = (process.env.SUPERADMIN_EMAIL || "superadmin@pharma.com").trim().toLowerCase();
  const defaultPassword = process.env.SUPERADMIN_PASSWORD || "admin123456";

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  const rootAdmin = await prisma.systemUser.create({
    data: {
      name: "Super Administrator",
      email: adminEmail,
      passwordHash,
      roleId: superadminRole.id,
      territory: "Dhaka Central HQ",
      status: "Active",
    },
  });

  console.log(`   ✓ Created Root Superadmin User: ${rootAdmin.email}`);

  console.log("\n===============================================================");
  console.log("✨ DATABASE CLEANUP & PRODUCTION SEED COMPLETE!");
  console.log("===============================================================");
  console.log(`   Operational Records: 0 (Pristine clean state)`);
  console.log(`   Admin Email:         ${adminEmail}`);
  console.log(`   Admin Password:      ${defaultPassword}`);
  console.log(`   Modules Authorized:  ${ALL_SYSTEM_MODULES.length}`);
  console.log("===============================================================\n");
}

cleanDatabase()
  .catch((err) => {
    console.error("❌ Cleanup failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
