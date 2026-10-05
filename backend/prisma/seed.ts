/// <reference types="node" />
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SUPERADMIN_ROLE = {
  name: "Super Administrator",
  code: "SUPERADMIN",
  description: "Initial master operational role with unrestricted privileges across statutory audits, financial releases, and system settings.",
  isSystemDefault: true,
  permissions: [
    {
      module: "Doctor Registry",
      category: "Clinical",
      read: true,
      create: true,
      edit: true,
      delete: true,
      specialAction: "Re-rank Category Tiers",
      specialGranted: true,
    },
    {
      module: "FEFO Stock Control",
      category: "Warehouse",
      read: true,
      create: true,
      edit: true,
      delete: true,
      specialAction: "Quarantine / Write-off Batch",
      specialGranted: true,
    },
    {
      module: "Sales & Dispatch",
      category: "Logistics",
      read: true,
      create: true,
      edit: true,
      delete: true,
      specialAction: "Override Credit Hold",
      specialGranted: true,
    },
    {
      module: "Accounts & Collections",
      category: "Finance",
      read: true,
      create: true,
      edit: true,
      delete: true,
      specialAction: "Authorize Bank Release",
      specialGranted: true,
    },
    {
      module: "Staff & Payroll",
      category: "Human Resources",
      read: true,
      create: true,
      edit: true,
      delete: true,
      specialAction: "Issue Appointment Letters",
      specialGranted: true,
    },
  ],
};

async function seed() {
  console.log("🌱 Starting Database Seed for Superadmin Role & User...");

  // 1. Find or create the initial SUPERADMIN role
  let superadminRole = await prisma.systemRole.findFirst({
    where: {
      OR: [{ code: "SUPERADMIN" }, { code: "SUPER_ADMIN" }],
    },
  });

  if (!superadminRole) {
    console.log("Creating initial SUPERADMIN system role...");
    superadminRole = await prisma.systemRole.create({
      data: {
        name: SUPERADMIN_ROLE.name,
        code: SUPERADMIN_ROLE.code,
        description: SUPERADMIN_ROLE.description,
        isSystemDefault: SUPERADMIN_ROLE.isSystemDefault,
        permissions: {
          create: SUPERADMIN_ROLE.permissions,
        },
      },
    });
    console.log(`✅ SUPERADMIN role created with ID: ${superadminRole.id}`);
  } else {
    console.log(`ℹ️ SUPERADMIN role already exists (code: ${superadminRole.code}, id: ${superadminRole.id})`);
  }

  // 2. Find or create the root SUPERADMIN user
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
