const path = require("path");
const Module = require("module");
const fs = require("fs");

// Register require interceptors
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  // 1. Alias translation: @/* -> dist-tests/*
  if (id.startsWith("@/")) {
    const relativePath = id.substring(2);
    const resolvedPath = path.resolve(__dirname, "../dist-tests", relativePath);
    return originalRequire.call(this, resolvedPath);
  }

  // 2. Next.js Mock redirection
  if (id === "next/headers" || id === "next/navigation" || id === "next/cache") {
    return originalRequire.call(this, path.resolve(__dirname, "../dist-tests/tests/mocks/next"));
  }
  if (id === "react") {
    return {
      cache: (fn) => fn,
      default: { cache: (fn) => fn },
    };
  }
  if (id === "server-only") {
    return {};
  }

  // 3. Supabase Mocks redirection
  if (id.includes("lib/supabase/server") || id.includes("lib/supabase/admin")) {
    return originalRequire.call(this, path.resolve(__dirname, "../dist-tests/tests/mocks/supabase"));
  }

  // 4. External Integrations Mock redirection
  if (
    id.includes("lib/xero") ||
    id.includes("lib/quickbooks") ||
    id.includes("lib/gmail") ||
    id.includes("lib/resend") ||
    id.includes("lib/email/send-feedback")
  ) {
    return originalRequire.call(this, path.resolve(__dirname, "../dist-tests/tests/mocks/external"));
  }

  return originalRequire.call(this, id);
};

// Test files to execute
const testFiles = [
  "dist-tests/tests/feature1_auth.test.js",
  "dist-tests/tests/feature2_customer.test.js",
  "dist-tests/tests/feature3_automation.test.js",
  "dist-tests/tests/feature4_integrations.test.js",
  "dist-tests/tests/feature5_marketing.test.js",
  "dist-tests/tests/tier3_pairwise.test.js",
  "dist-tests/tests/tier4_workload.test.js",
];

async function run() {
  console.log("Starting E2E Server Actions test suite...");

  // Set required mock environment variables
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-key";
  process.env.RESEND_API_KEY = "mock-resend-key";

  for (const file of testFiles) {
    const absolutePath = path.resolve(__dirname, "..", file);
    if (!fs.existsSync(absolutePath)) {
      console.error(`Test file not found: ${absolutePath}`);
      continue;
    }
    // Require the test file, which registers/executes its tests
    originalRequire.call(module, absolutePath);
  }

  // Let any remaining microtasks/async tasks settle
  await new Promise((resolve) => setTimeout(resolve, 500));

  const framework = originalRequire.call(module, path.resolve(__dirname, "../dist-tests/tests/framework"));
  const summary = framework.getTestSummary();

  console.log("\n=================================");
  console.log("Tests Run Summary:");
  console.log(`  Passed: ${summary.passCount}`);
  console.log(`  Failed: ${summary.failCount}`);
  console.log("=================================");

  if (summary.failCount > 0) {
    console.error("\nFailures:");
    summary.failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  } else {
    console.log("\nAll tests passed successfully!");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Runner crash:", err);
  process.exit(1);
});
