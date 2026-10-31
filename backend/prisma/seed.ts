/// <reference types="node" />
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ALL_SYSTEM_MODULES, overviewGrantMap, packOverviewGrants } from "../src/constants/moduleCatalog";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Starting Database Seed for Superadmin Role & User...");

  // 1. Ensure corporate Role exists in prisma.role for Super Administrator
  let corpSuperRole = await prisma.role.findFirst({
    where: { name: { equals: "Super Administrator", mode: "insensitive" } },
  });

  if (!corpSuperRole) {
    console.log("Creating corporate Role: Super Administrator...");
    corpSuperRole = await prisma.role.create({
      data: {
        name: "Super Administrator",
        permissions: ["ALL_ACCESS", "VIEW_DASHBOARD"],
      },
    });
    console.log(`✅ Corporate Role created with ID: ${corpSuperRole.id}`);
  }

  // 2. Find or create the initial SUPERADMIN system role in prisma.systemRole
  let superadminRole = await prisma.systemRole.findFirst({
    where: {
      OR: [{ code: "SUPERADMIN" }, { code: "SUPER_ADMIN" }],
    },
  });

  if (!superadminRole) {
    console.log("Creating initial SUPERADMIN system role...");
    superadminRole = await prisma.systemRole.create({
      data: {
        name: "Super Administrator",
        code: "SUPERADMIN",
        description: "Initial master operational role with unrestricted privileges across statutory audits, financial releases, and system settings.",
        isSystemDefault: true,
      },
    });
    console.log(`✅ SUPERADMIN system role created with ID: ${superadminRole.id}`);
  } else {
    console.log(`ℹ️ SUPERADMIN role already exists (code: ${superadminRole.code}, id: ${superadminRole.id})`);
  }

  // 3. Grant full permissions for ALL 28 system modules
  console.log("Syncing master permissions for all modules...");
  for (const mod of ALL_SYSTEM_MODULES) {
    const existingPerm = await prisma.rolePermission.findFirst({
      where: {
        roleId: superadminRole.id,
        module: mod.module,
      },
    });

    if (!existingPerm) {
      await prisma.rolePermission.create({
        data: {
          roleId: superadminRole.id,
          module: mod.module,
          category: mod.category,
          read: true,
          create: mod.actions.includes("create"),
          edit: mod.actions.includes("edit"),
          delete: mod.actions.includes("delete"),
          specialAction: packOverviewGrants(overviewGrantMap(mod, true)),
          specialGranted: Boolean(mod.specialAction),
        },
      });
    } else {
      await prisma.rolePermission.update({
        where: { id: existingPerm.id },
        data: {
          category: mod.category,
          read: true,
          create: mod.actions.includes("create"),
          edit: mod.actions.includes("edit"),
          delete: mod.actions.includes("delete"),
          specialAction: packOverviewGrants(overviewGrantMap(mod, true)),
          specialGranted: Boolean(mod.specialAction),
        },
      });
    }
  }

  // 4. Find or create the root SUPERADMIN user
  const adminEmail = process.env.SUPERADMIN_EMAIL || "superadmin@pharma.com";
  const defaultPassword = process.env.SUPERADMIN_PASSWORD || "admin123456";

  const existingUser = await prisma.systemUser.findUnique({
    where: { email: adminEmail.trim().toLowerCase() },
  });

  if (!existingUser) {
    console.log(`Creating initial SUPERADMIN user (${adminEmail})...`);
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const newUser = await prisma.systemUser.create({
      data: {
        name: "Super Administrator",
        email: adminEmail.trim().toLowerCase(),
        passwordHash,
        roleId: superadminRole.id,
        territory: "Dhaka Central HQ",
        status: "Active",
      },
    });
    console.log(`✅ SUPERADMIN user created successfully: ${newUser.email}`);
  } else {
    console.log(`ℹ️ SUPERADMIN user already exists: ${existingUser.email}`);
  }

  console.log("\n========================================================");
  console.log("🎉 Superadmin Seed Complete!");
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${defaultPassword}`);
  console.log(`   Role:     ${superadminRole.code}`);
  console.log(`   Modules:  ${ALL_SYSTEM_MODULES.length} fully granted`);
  console.log("========================================================\n");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
