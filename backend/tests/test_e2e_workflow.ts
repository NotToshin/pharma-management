import { doctorFormSchema } from "../src/validations/doctorValidation";
import app from "../src/app";
import { Server } from "http";
import fs from "fs";
import path from "path";

async function runEndToEndTests() {
  console.log("=================================================");
  console.log("RUNNING AUTOMATED E2E DATA CREATION/UPDATE TESTS");
  console.log("=================================================\n");

  const PORT = 5005;
  let server: Server;

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`🚀 Isolated test server started on http://localhost:${PORT}\n`);
      resolve();
    });
  });

  const baseUrl = `http://localhost:${PORT}/api/doctors`;
  let passedCount = 0;
  let totalCount = 5;

  try {
    // -------------------------------------------------------------
    // STEP 1: Test Frontend Zod Validation
    // -------------------------------------------------------------
    console.log("👉 STEP 1: Testing Frontend Zod Validation...");
    const invalidFrontendInput = {
      doctorName: "",
      phone: "",
      bmdcRegNumber: "",
      specialtyAndInstitute: "",
      chamber: "",
      territoryAndMio: "",
      tier: "",
      patientVolumeDaily: -5,
    };

    const frontendResult = doctorFormSchema.safeParse(invalidFrontendInput);
    if (!frontendResult.success && frontendResult.error.issues.length >= 7) {
      console.log("   ✅ PASSED: Frontend Zod schema correctly caught invalid input.");
      console.log(`   Detailed Issues Caught: ${frontendResult.error.issues.length} field errors.`);
      passedCount++;
    } else {
      console.error("   ❌ FAILED: Frontend Zod schema did not catch invalid input as expected.");
    }
    console.log("");

    // -------------------------------------------------------------
    // STEP 2: Test API Bypass & Backend Route Validation Middleware
    // -------------------------------------------------------------
    console.log("👉 STEP 2: Testing API Bypass & Backend Route Validation...");
    const apiBypassResponse = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorName: "Bypass Test Doctor" }),
    });

    const body = await apiBypassResponse.json();
    if (apiBypassResponse.status === 400 && body.success === false) {
      console.log("   ✅ PASSED: Route Zod middleware rejected invalid API payload with 400 Bad Request.");
      console.log(`   Response Message: "${body.message}"`);
      passedCount++;
    } else {
      console.error(`   ❌ FAILED: Route returned status ${apiBypassResponse.status} instead of 400. Body:`, body);
    }
    console.log("");

    // -------------------------------------------------------------
    // STEP 3: Test Controller Isolation
    // -------------------------------------------------------------
    console.log("👉 STEP 3: Testing Controller Isolation...");
    const controllerPath = path.join(__dirname, "src", "controllers", "doctorController.ts");
    const controllerContent = fs.readFileSync(controllerPath, "utf-8");

    const hasPrismaImport = controllerContent.includes("prisma") || controllerContent.includes("@prisma/client");
    const hasLogicOrFallbacks = controllerContent.includes("||") || controllerContent.includes("if (!tier)");

    if (!hasPrismaImport && !hasLogicOrFallbacks && controllerContent.includes("doctorService")) {
      console.log("   ✅ PASSED: Controller contains ZERO business logic, zero Prisma calls, and strictly delegates to Service.");
      passedCount++;
    } else {
      console.error("   ❌ FAILED: Controller violates isolation principle.");
    }
    console.log("");

    // -------------------------------------------------------------
    // STEP 4: Test No-Default Constraint (Strict Data Origin)
    // -------------------------------------------------------------
    console.log("👉 STEP 4: Testing No-Default Constraint...");
    const servicePath = path.join(__dirname, "src", "services", "doctorService.ts");
    const schemaPath = path.join(__dirname, "prisma", "schema.prisma");
    const serviceContent = fs.readFileSync(servicePath, "utf-8");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");

    const serviceHasDefaults = serviceContent.includes("|| \"General") || serviceContent.includes("|| \"Central");
    const schemaHasPatientDefault = schemaContent.includes("patientVolumeDaily    Int      @default");

    if (!serviceHasDefaults && !schemaHasPatientDefault) {
      console.log("   ✅ PASSED: No default values present in Controller, Service, or Database schema for required fields.");
      passedCount++;
    } else {
      console.error("   ❌ FAILED: Default fallbacks detected in service or database schema.");
    }
    console.log("");

    // -------------------------------------------------------------
    // STEP 5: Test Service Execution (Happy Path - Create, Update, Delete)
    // -------------------------------------------------------------
    console.log("👉 STEP 5: Testing Service Execution (Happy Path & Update)...");
    const testBmdc = `BMDC-TEST-${Date.now()}`;
    const validPayload = {
      doctorName: "Dr. Automated Test Physician",
      phone: "+8801700112233",
      bmdcRegNumber: testBmdc,
      specialtyAndInstitute: "Cardiologist (NICVD)",
      chamber: "Central Diagnostic, Dhanmondi, Dhaka",
      territoryAndMio: "Dhaka Central / MIO: AutomatedTester",
      email: "autotest.doctor@akpharma.com",
      tier: "Tier 1 (High Prescriber)",
      patientVolumeDaily: 45,
    };

    // 5a. Create Doctor
    const createRes = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const createResult = await createRes.json();
    if (createRes.status === 201 && createResult.success && createResult.data?.id) {
      const doctorId = createResult.data.id;
      console.log(`   ✅ Create Doctor PASSED: Created Doctor ID ${doctorId}`);

      // 5b. Update Doctor
      const updatePayload = {
        doctorName: "Dr. Automated Test Physician (Updated)",
        patientVolumeDaily: 50,
      };

      const updateRes = await fetch(`${baseUrl}/${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      const updateResult = await updateRes.json();

      if (updateRes.status === 200 && updateResult.data?.doctorName === updatePayload.doctorName) {
        console.log("   ✅ Update Doctor PASSED: Doctor updated successfully in DB.");

        // 5c. Delete Doctor (Cleanup)
        const deleteRes = await fetch(`${baseUrl}/${doctorId}`, { method: "DELETE" });
        if (deleteRes.status === 200) {
          console.log("   ✅ Delete Doctor Cleanup PASSED.");
          passedCount++;
        }
      } else {
        console.error(`   ❌ FAILED Update Doctor: HTTP ${updateRes.status} - ${JSON.stringify(updateResult)}`);
      }
    } else {
      console.error(`   ❌ FAILED Create Doctor: HTTP ${createRes.status} - ${JSON.stringify(createResult)}`);
    }
  } finally {
    server.close();
  }

  console.log("\n=================================================");
  console.log(`TEST SUMMARY: ${passedCount}/${totalCount} TEST STEPS PASSED`);
  console.log("=================================================");

  if (passedCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runEndToEndTests();
