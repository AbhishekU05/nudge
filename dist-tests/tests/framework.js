"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = void 0;
exports.describe = describe;
exports.it = it;
exports.expect = expect;
exports.getTestSummary = getTestSummary;
const store_1 = require("./mocks/store");
let currentSuiteName = "";
const failures = [];
let passCount = 0;
let failCount = 0;
function describe(name, fn) {
    currentSuiteName = name;
    console.log(`\nSuite: ${name}`);
    fn();
}
async function it(name, fn) {
    const suiteName = currentSuiteName;
    (0, store_1.resetMockStore)();
    try {
        await fn();
        passCount++;
        console.log(`  ✓ ${name}`);
    }
    catch (error) {
        failCount++;
        const testFullName = `${suiteName} > ${name}`;
        failures.push(`${testFullName}: ${error.stack || error.message}`);
        console.error(`  ✗ ${name}`);
        console.error(error.stack || error);
    }
}
exports.test = it;
function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`Expected ${actual} to be ${expected}`);
            }
        },
        toEqual(expected) {
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
        toContain(element) {
            if (!actual || !actual.includes(element)) {
                throw new Error(`Expected ${JSON.stringify(actual)} to contain ${element}`);
            }
        },
        toThrow(expectedError) {
            let threw = false;
            let errorThrown = null;
            try {
                actual();
            }
            catch (err) {
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
        async toThrowAsync(expectedError) {
            let threw = false;
            let errorThrown = null;
            try {
                await actual();
            }
            catch (err) {
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
function getTestSummary() {
    return { passCount, failCount, failures };
}
