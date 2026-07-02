import { mockStore, resetMockStore } from "./mocks/store";

let currentSuiteName = "";
const failures: string[] = [];
let passCount = 0;
let failCount = 0;

export function describe(name: string, fn: () => void) {
  currentSuiteName = name;
  console.log(`\nSuite: ${name}`);
  fn();
}

export async function it(name: string, fn: () => Promise<void> | void) {
  const suiteName = currentSuiteName;
  resetMockStore();
  try {
    await fn();
    passCount++;
    console.log(`  ✓ ${name}`);
  } catch (error: any) {
    failCount++;
    const testFullName = `${suiteName} > ${name}`;
    failures.push(`${testFullName}: ${error.stack || error.message}`);
    console.error(`  ✗ ${name}`);
    console.error(error.stack || error);
  }
}

export const test = it;

export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toEqual(expected: any) {
      const actStr = JSON.stringify(actual);
      const expStr = JSON.stringify(expected);
      if (actStr !== expStr) {
        throw new Error(`Expected ${actStr} to equal ${expStr}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected ${actual} to be null`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected ${actual} to be falsy`);
      }
    },
    toContain(element: any) {
      if (!actual || !actual.includes(element)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to contain ${element}`);
      }
    },
    toThrow(expectedError?: any) {
      let threw = false;
      let errorThrown: any = null;
      try {
        actual();
      } catch (err: any) {
        threw = true;
        errorThrown = err;
      }
      if (!threw) {
        throw new Error(`Expected function to throw an error`);
      }
      if (expectedError) {
        if (typeof expectedError === "string" && !errorThrown.message.includes(expectedError)) {
          throw new Error(`Expected thrown error message "${errorThrown.message}" to contain "${expectedError}"`);
        }
      }
    },
    async toThrowAsync(expectedError?: any) {
      let threw = false;
      let errorThrown: any = null;
      try {
        await actual();
      } catch (err: any) {
        threw = true;
        errorThrown = err;
      }
      if (!threw) {
        throw new Error(`Expected function to throw an error`);
      }
      if (expectedError) {
        if (typeof expectedError === "string" && !errorThrown.message.includes(expectedError)) {
          throw new Error(`Expected thrown error message "${errorThrown.message}" to contain "${expectedError}"`);
        }
      }
    },
  };
}

export function getTestSummary() {
  return { passCount, failCount, failures };
}
