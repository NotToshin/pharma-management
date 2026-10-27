const BASE_URL = 'http://localhost:5000/api';

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${json.message || res.statusText}`);
  }
  const token = json.data?.accessToken;
  const user = json.data?.user;
  console.log(`🔐 Logged in: ${user.name} <${user.email}> | Role: ${user.roleName || user.role}`);
  return {
    token,
    user,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
}

async function runMultiUserAuditTest() {
  console.log('========================================================================');
  console.log('🚀 COMPREHENSIVE END-TO-END MULTI-USER AUDIT TRAIL TEST (21 CFR PART 11)');
  console.log('========================================================================\n');

  // Track created entities for cleanup
  let doctorId = null;
  let roleId = null;
  let visitLogId = null;
  let clientId = null;
  let staffId = null;

  // -------------------------------------------------------------
  // USER 1: Super Administrator (superadmin@pharma.com)
  // -------------------------------------------------------------
  console.log('--- USER 1: Super Administrator Actions ---');
  const adminAuth = await loginUser('superadmin@pharma.com', 'admin123456');

  // Action 1.1: Register Doctor (Clinical Registry)
  const bmdcReg = `BMDC-E2E-${Date.now().toString().slice(-5)}`;
  const doctorRes = await fetch(`${BASE_URL}/doctors`, {
    method: 'POST',
    headers: {
      ...adminAuth.headers,
      'x-audit-reason': 'Annual clinical prescriber onboarding & qualification credentialing.',
    },
    body: JSON.stringify({
      doctorName: 'Dr. Shahadat Hossain',
      phone: '+880 1812-445566',
      bmdcRegNumber: bmdcReg,
      specialtyAndInstitute: 'Cardiology (National Heart Foundation)',
      chamber: 'Mirpur Diagnostic Complex, Suite 402',
      territory: 'Dhaka North - Mirpur',
      email: 'dr.shahadat@cardio-bd.org',
      tier: 'Tier B',
      patientVolumeDaily: 45,
    }),
  });
  const doctorJson = await doctorRes.json();
  if (!doctorRes.ok) throw new Error(`Doctor creation failed: ${doctorJson.message}`);
  doctorId = doctorJson.data.id;
  console.log(`✅ [Superadmin] Doctor created: Dr. Shahadat Hossain (${bmdcReg}) -> ID: ${doctorId}`);

  // Action 1.2: Update Doctor Tier (Clinical Registry)
  const doctorUpdateRes = await fetch(`${BASE_URL}/doctors/${doctorId}`, {
    method: 'PUT',
    headers: {
      ...adminAuth.headers,
      'x-audit-reason': 'Clinical re-ranking: Promoted to Tier A based on high prescription volume.',
    },
    body: JSON.stringify({
      tier: 'Tier A',
      patientVolumeDaily: 60,
    }),
  });
  const doctorUpdateJson = await doctorUpdateRes.json();
  if (!doctorUpdateRes.ok) throw new Error(`Doctor update failed: ${doctorUpdateJson.message}`);
  console.log(`✅ [Superadmin] Doctor re-ranked to Tier A`);

  // Action 1.3: Create Corporate Role (RBAC Security)
  const roleName = `Clinical Safety Officer ${Date.now().toString().slice(-4)}`;
  const roleRes = await fetch(`${BASE_URL}/roles`, {
    method: 'POST',
    headers: {
      ...adminAuth.headers,
      'x-audit-reason': 'Corporate restructuring: establishing clinical pharmacovigilance role.',
    },
    body: JSON.stringify({
      name: roleName,
      permissions: ['VIEW_DASHBOARD', 'VIEW_CLINICAL_REGISTRY'],
    }),
  });
  const roleJson = await roleRes.json();
  if (!roleRes.ok) throw new Error(`Role creation failed: ${roleJson.message}`);
  roleId = roleJson.data.id;
  console.log(`✅ [Superadmin] Role created: '${roleName}' -> ID: ${roleId}\n`);

  // -------------------------------------------------------------
  // USER 2: Medical Information Officer (yeasin@pharma.com)
  // -------------------------------------------------------------
  console.log('--- USER 2: Medical Information Officer Actions ---');
  const mioAuth = await loginUser('yeasin@pharma.com', '123456');

  // Action 2.1: Log Doctor Visit (Field Force)
  const visitRes = await fetch(`${BASE_URL}/doctor-visit-logs`, {
    method: 'POST',
    headers: {
      ...mioAuth.headers,
      'x-audit-reason': 'DCR: Morning clinical promotion call at Mirpur Cardiology Clinic.',
    },
    body: JSON.stringify({
      doctorName: 'Dr. Shahadat Hossain',
      specialty: 'Cardiology',
      chamber: 'Mirpur Diagnostic Complex',
      mioName: 'Yeasin',
      territory: 'Dhaka North - Mirpur',
      visitDate: '2026-10-26',
      visitTime: '10:15 AM',
      promotedDrugs: 'CardioFix 50mg, AtenoPlus 25mg',
      samplesGiven: 'CardioFix 50mg (4 physician packs)',
      feedback: 'Positive',
    }),
  });
  const visitJson = await visitRes.json();
  if (!visitRes.ok) throw new Error(`Visit log creation failed: ${visitJson.message}`);
  visitLogId = visitJson.data.id;
  console.log(`✅ [MIO Yeasin] Visit Log created: ${visitJson.data.dcrCode} -> ID: ${visitLogId}`);

  // Action 2.2: Register Pharmacy Client (Sales & Deliveries)
  const clientRes = await fetch(`${BASE_URL}/clients`, {
    method: 'POST',
    headers: {
      ...mioAuth.headers,
      'x-audit-reason': 'New pharmacy outlet registered for route delivery schedule.',
    },
    body: JSON.stringify({
      pharmacyName: `Dhanmondi PharmaCare ${Date.now().toString().slice(-4)}`,
      proprietor: 'Kabir Ahmed',
      phone: '+880 1711-332211',
      drugLicenseNo: `DL-DH-${Date.now().toString().slice(-4)}`,
      tradeLicenseNo: `TL-DH-${Date.now().toString().slice(-4)}`,
      address: 'House 12, Road 4, Dhanmondi, Dhaka',
      territory: 'Dhaka South - Dhanmondi',
      assignedMio: 'Yeasin',
      creditLimitBDT: 150000,
      creditTermDays: 30,
      status: 'Active / Healthy',
    }),
  });
  const clientJson = await clientRes.json();
  if (!clientRes.ok) throw new Error(`Client creation failed: ${clientJson.message}`);
  clientId = clientJson.data.id;
  console.log(`✅ [MIO Yeasin] Pharmacy Client registered: '${clientJson.data.pharmacyName}' -> ID: ${clientId}\n`);

  // -------------------------------------------------------------
  // USER 3: Head of HR (hr.lead@pharma.com)
  // -------------------------------------------------------------
  console.log('--- USER 3: Head of HR Actions ---');
  const hrAuth = await loginUser('hr.lead@pharma.com', '123456');

  // Action 3.1: Onboard Staff Member (Workforce & HR)
  const staffRes = await fetch(`${BASE_URL}/staff`, {
    method: 'POST',
    headers: {
      ...hrAuth.headers,
      'x-audit-reason': 'Authorized recruitment: Field Quality Inspector onboarding.',
    },
    body: JSON.stringify({
      fullName: 'Kamrul Hasan E2E',
      phone: '+880 1912-778899',
      email: `kamrul.e2e.${Date.now().toString().slice(-4)}@pharma.com`,
      department: 'Quality Assurance',
      designation: 'Senior QA Inspector',
      salary: 45000,
      territory: 'Dhaka Central HQ',
      supervisor: 'Toshin Bin Azad (Head of HR)',
      employmentStatus: 'Active',
    }),
  });
  const staffJson = await staffRes.json();
  if (!staffRes.ok) throw new Error(`Staff creation failed: ${staffJson.message}`);
  staffId = staffJson.data.id;
  console.log(`✅ [HR Lead] Staff Onboarded: '${staffJson.data.fullName}' (EmpID: ${staffJson.data.empId}) -> ID: ${staffId}`);

  // Action 3.2: Update Staff Profile
  const staffUpdateRes = await fetch(`${BASE_URL}/staff/${staffId}`, {
    method: 'PUT',
    headers: {
      ...hrAuth.headers,
      'x-audit-reason': 'Probation completion: Confirmed permanent employment status.',
    },
    body: JSON.stringify({
      department: 'Regulatory & Compliance',
      status: 'ACTIVE',
    }),
  });
  const staffUpdateJson = await staffUpdateRes.json();
  if (!staffUpdateRes.ok) throw new Error(`Staff update failed: ${staffUpdateJson.message}`);
  console.log(`✅ [HR Lead] Staff Profile Updated: Department shifted to 'Regulatory & Compliance'\n`);

  // -------------------------------------------------------------
  // VERIFICATION: Check Audit Trail Logs & Multi-User Attribution
  // -------------------------------------------------------------
  console.log('========================================================================');
  console.log('🔍 VERIFYING AUDIT TRAIL RECORD ATTRIBUTIONS (WHO, WHAT, WHY)');
  console.log('========================================================================');

  const auditRes = await fetch(`${BASE_URL}/audit-logs?limit=15`, { headers: adminAuth.headers });
  const auditJson = await auditRes.json();
  const rawLogs = auditJson.data?.logs || auditJson.data?.items || auditJson.data || [];

  console.log(`Retrieved latest ${rawLogs.length} audit trail blocks:\n`);

  let superadminCount = 0;
  let mioCount = 0;
  let hrLeadCount = 0;

  rawLogs.slice(0, 10).forEach((l) => {
    console.log(`[${l.auditRef}] Module: ${l.module.padEnd(20)} | Action: ${l.actionType.padEnd(26)}`);
    console.log(`   👤 WHO:  ${l.actorName} <${l.actorEmail}> [Role: ${l.actorRole}]`);
    console.log(`   🎯 WHAT: ${l.entityTarget}`);
    console.log(`   💡 WHY:  ${l.reasonForChange}`);
    console.log(`   🔒 HASH: ${l.sha256Hash?.slice(0, 24)}... (Prev: ${l.previousHash?.slice(0, 16)}...)\n`);

    if (l.actorEmail === 'superadmin@pharma.com') superadminCount++;
    if (l.actorEmail === 'yeasin@pharma.com') mioCount++;
    if (l.actorEmail === 'hr.lead@pharma.com') hrLeadCount++;
  });

  console.log('Multi-user attribution tally in recent audit records:');
  console.log(` - Super Administrator (superadmin@pharma.com): ${superadminCount} events`);
  console.log(` - MIO Field Officer   (yeasin@pharma.com):     ${mioCount} events`);
  console.log(` - Head of HR          (hr.lead@pharma.com):    ${hrLeadCount} events\n`);

  if (superadminCount === 0 || mioCount === 0 || hrLeadCount === 0) {
    throw new Error('❌ Multi-user attribution check failed: Not all users were recorded in audit trail!');
  }
  console.log('✅ ALL DISTINCT USERS ARE ACCURATELY ATTRIBUTED IN THE AUDIT LOG!\n');

  // -------------------------------------------------------------
  // VERIFICATION: 21 CFR Part 11 Hash Chain Integrity Check
  // -------------------------------------------------------------
  console.log('========================================================================');
  console.log('🛡️ VERIFYING 21 CFR PART 11 CRYPTOGRAPHIC HASH CHAIN INTEGRITY');
  console.log('========================================================================');

  const chainRes = await fetch(`${BASE_URL}/audit-logs/verify-chain`);
  const chainJson = await chainRes.json();
  const chainData = chainJson.data;

  console.log(`Status:         ${chainData.valid ? '✅ VALID (100% Intact Chain)' : '❌ INVALID/CORRUPTED'}`);
  console.log(`Total Blocks:   ${chainData.totalBlocks}`);
  console.log(`Total Verified: ${chainData.totalVerified} / ${chainData.totalBlocks}`);
  console.log(`Genesis Hash:   ${chainData.genesisHash}`);
  console.log(`Head Hash:      ${chainData.headHash}`);
  console.log(`Summary:        ${chainData.message}\n`);

  if (!chainData.valid) {
    throw new Error('❌ Hash chain verification failed!');
  }

  // -------------------------------------------------------------
  // CLEANUP & DELETION AUDIT TRAIL VERIFICATION
  // -------------------------------------------------------------
  console.log('========================================================================');
  console.log('🧹 TESTING DELETION AUDIT EVENTS & POST-CLEANUP CHAIN INTEGRITY');
  console.log('========================================================================');

  // Superadmin deletes Doctor & Role
  if (doctorId) {
    const delDoc = await fetch(`${BASE_URL}/doctors/${doctorId}`, {
      method: 'DELETE',
      headers: {
        ...adminAuth.headers,
        'x-audit-reason': 'Regulatory test cleanup: Archiving test doctor record.',
      },
    });
    console.log(`🗑️ [Superadmin] Deleted Doctor: HTTP ${delDoc.status}`);
  }
  if (roleId) {
    const delRole = await fetch(`${BASE_URL}/roles/${roleId}`, {
      method: 'DELETE',
      headers: {
        ...adminAuth.headers,
        'x-audit-reason': 'Decommissioning test corporate role.',
      },
    });
    console.log(`🗑️ [Superadmin] Deleted Role: HTTP ${delRole.status}`);
  }

  // MIO Yeasin deletes Visit Log & Client
  if (visitLogId) {
    const delVisit = await fetch(`${BASE_URL}/doctor-visit-logs/${visitLogId}`, {
      method: 'DELETE',
      headers: {
        ...mioAuth.headers,
        'x-audit-reason': 'Retrospective purge of test DCR entry.',
      },
    });
    console.log(`🗑️ [MIO Yeasin] Deleted Visit Log: HTTP ${delVisit.status}`);
  }
  if (clientId) {
    const delClient = await fetch(`${BASE_URL}/clients/${clientId}`, {
      method: 'DELETE',
      headers: {
        ...mioAuth.headers,
        'x-audit-reason': 'Pharmacy client test registry purge.',
      },
    });
    console.log(`🗑️ [MIO Yeasin] Deleted Client: HTTP ${delClient.status}`);
  }

  // HR Lead deletes Staff
  if (staffId) {
    const delStaff = await fetch(`${BASE_URL}/staff/${staffId}`, {
      method: 'DELETE',
      headers: {
        ...hrAuth.headers,
        'x-audit-reason': 'HR test employee record purge.',
      },
    });
    console.log(`🗑️ [HR Lead] Deleted Staff: HTTP ${delStaff.status}`);
  }

  // Final Chain Verification Post-Cleanup
  const finalChainRes = await fetch(`${BASE_URL}/audit-logs/verify-chain`);
  const finalChainJson = await finalChainRes.json();
  const finalChainData = finalChainJson.data;

  console.log('\nFinal Audit Chain Status Post-Deletions:');
  console.log(` - Valid:          ${finalChainData.valid ? 'YES (100% Intact)' : 'NO'}`);
  console.log(` - Blocks:         ${finalChainData.totalBlocks}`);
  console.log(` - Total Verified: ${finalChainData.totalVerified} / ${finalChainData.totalBlocks}`);
  console.log(` - Message:        ${finalChainData.message}`);

  if (!finalChainData.valid) {
    throw new Error('❌ Post-cleanup hash chain verification failed!');
  }

  console.log('\n========================================================================');
  console.log('🎉 END-TO-END MULTI-USER AUDIT TRAIL TEST COMPLETED SUCCESSFULLY! 🎉');
  console.log('========================================================================');
}

runMultiUserAuditTest().catch((err) => {
  console.error('\n❌ Test execution failed with error:', err);
  process.exit(1);
});
