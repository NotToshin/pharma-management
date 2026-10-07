import { visitLogFormSchema } from "./src/validations/doctorVisitLogValidation";
import app from "./src/app";
import { Server } from "http";
import fs from "fs";
import path from "path";

async function runVisitLogE2ETests() {
  console.log("=================================================");
  console.log("RUNNING AUTOMATED E2E DOCTOR VISIT LOG TESTS");
  console.log("=================================================\n");

  const PORT = 5006;
  let server: Server | null = null;

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`🚀 Isolated test server started on http://localhost:${PORT}\n`);
      resolve();
    });
  });

  const baseUrl = `http://localhost:${PORT}/api/visit-logs`;
  let passedCount = 0;
  let totalCount = 5;

  try {
    // -------------------------------------------------------------
    // STEP 1: Test Frontend Zod Validation
    // -------------------------------------------------------------
    console.log("👉 STEP 1: Testing Frontend Zod Validation...");
    const invalidInput = {
      doctorName: "",
      specialty: "",
      chamber: "",
      mioName: "",
      territory: "",
      visitDate: "",
      visitTime: "",
      promotedDrugs: "",
      samplesGiven: "",
      feedback: "InvalidFeedbackType",
    };

    const frontendResult = visitLogFormSchema.safeParse(invalidInput);
    if (!frontendResult.success && frontendResult.error.issues.length >= 9) {
      console.log("   ✅ PASSED: Zod schema caught invalid visit log input.");
      console.log(`   Detailed Issues Caught: ${frontendResult.error.issues.length} field errors.`);
      passedCount++;
    } else {
      console.error("   ❌ FAILED: Zod schema did not catch invalid visit log input.");
    }
    console.log("");

    // -------------------------------------------------------------
    // STEP 2: Test API Bypass & Backend Validation Middleware
    // -------------------------------------------------------------
    console.log("👉 STEP 2: Testing API Bypass & Backend Route Validation...");
    const apiBypassResponse = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorName: "Bypass Visit Log" }),
    });

    const body = await apiBypassResponse.json();
    if (apiBypassResponse.status === 400 && body.success === false) {
      console.log("   ✅ PASSED: Route Zod middleware rejected invalid payload with 400 Bad Request.");
      console.log(`   Response Message: "${body.message}"`);
      passedCount++;
    } else {
      console.error(`   ❌ FAILED: Route returned status ${apiBypassResponse.status} instead of 400.`);
    }
    console.log("");

    // -------------------------------------------------------------
    // STEP 3: Test Controller Isolation
    // -------------------------------------------------------------
    console.log("👉 STEP 3: Testing Controller Isolation...");
    const controllerPath = path.join(__dirname, "src", "controllers", "doctorVisitLogController.ts");
    const controllerContent = fs.readFileSync(controllerPath, "utf-8");

    const hasPrismaImport = controllerContent.includes("prisma") || controllerContent.includes("@prisma/client");
    const hasLogicOrFallbacks = controllerContent.includes("||");

    if (!hasPrismaImport && !hasLogicOrFallbacks && controllerContent.includes("doctorVisitLogService")) {
      console.log("   ✅ PASSED: Visit Log Controller contains ZERO business logic and strictly delegates to Service.");
      passedCount++;
    } else {
      console.error("   ❌ FAILED: Controller violates isolation principle.");
    }
    console.log("");

    // -------------------------------------------------------------
    // STEP 4: Test No-Default Constraint
    // -------------------------------------------------------------
    console.log("👉 STEP 4: Testing No-Default Constraint...");
    const servicePath = path.join(__dirname, "src", "services", "doctorVisitLogService.ts");
    const schemaPath = path.join(__dirname, "prisma", "schema.prisma");
    const serviceContent = fs.readFileSync(servicePath, "utf-8");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");

    const serviceHasDefaults = serviceContent.includes("|| \"General") || serviceContent.includes("|| \"Central");
    const schemaHasDefaults = schemaContent.includes("feedback      String   @default");

    if (!serviceHasDefaults && !schemaHasDefaults) {
      console.log("   ✅ PASSED: No default values present for required fields in DoctorVisitLog.");
      passedCount++;
    } else {
      console.error("   ❌ FAILED: Default fallbacks detected.");
    }
    console.log("");

    // -------------------------------------------------------------
    // STEP 5: Test Service Execution (Happy Path & Update Path)
    // -------------------------------------------------------------
    console.log("👉 STEP 5: Testing Service Execution (Happy Path & Update)...");
    const validLogPayload = {
      doctorName: "Dr. Test Cardiologist",
      specialty: "Cardiology",
      chamber: "Square Hospital, Panthapath, Dhaka",
      mioName: "Rafiqul Islam",
      territory: "Dhaka North",
      visitDate: "2026-10-07",
      visitTime: "11:00 AM",
      promotedDrugs: "Rosuvastatin 10mg, Cardiloc 5mg",
      samplesGiven: "4 Strips",
      feedback: "High Potential",
    };

    // 5a. Create Visit Log
    const createRes = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validLogPayload),
    });

    const createResult = await createRes.json();
    if (createRes.status === 201 && createResult.success && createResult.data?.id) {
      const logId = createResult.data.id;
      console.log(`   ✅ Create Visit Log PASSED: Created Log ID ${logId} (${createResult.data.dcrCode})`);

      // 5b. Update Visit Log
      const updatePayload = {
        promotedDrugs: "Rosuvastatin 10mg, Cardiloc 5mg, Omeprazole 20mg",
        feedback: "Positive",
      };

      const updateRes = await fetch(`${baseUrl}/${logId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      const updateResult = await updateRes.json();

      if (updateRes.status === 200 && updateResult.data?.feedback === "Positive") {
        console.log("   ✅ Update Visit Log PASSED: Record updated in DB.");

        // 5c. Delete Visit Log (Cleanup)
        const deleteRes = await fetch(`${baseUrl}/${logId}`, { method: "DELETE" });
        if (deleteRes.status === 200) {
          console.log("   ✅ Delete Visit Log Cleanup PASSED.");
          passedCount++;
        }
      } else {
        console.error(`   ❌ FAILED Update Visit Log: ${JSON.stringify(updateResult)}`);
      }
    } else {
      console.error(`   ❌ FAILED Create Visit Log: ${JSON.stringify(createResult)}`);
    }
  } finally {
    if (server) (server as Server).close();
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

runVisitLogE2ETests();
