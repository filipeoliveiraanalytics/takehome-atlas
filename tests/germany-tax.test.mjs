import assert from "node:assert/strict";
import test from "node:test";

import { germanyNet } from "../app/tax.ts";

const scenarios = [
  { gross: 50_000, tax: 6_788, annualNet: 32_337 },
  { gross: 80_000, tax: 15_694, annualNet: 48_048.88 },
  { gross: 100_000, tax: 23_592.86, annualNet: 58_030.02 },
];

for (const scenario of scenarios) {
  test(`Germany 2026: €${scenario.gross} tax class I`, () => {
    const result = germanyNet(scenario.gross);

    assert.ok(Math.abs(result.tax - scenario.tax) < 0.01);
    assert.ok(Math.abs(result.net - scenario.annualNet) < 0.01);
  });
}

test("Germany 2026 uses the health and care contribution ceiling", () => {
  const atCeiling = germanyNet(69_750);
  const aboveCeiling = germanyNet(70_750);
  const pensionAndUnemploymentOnExtraSalary = 1_000 * 0.106;

  assert.ok(
    Math.abs((aboveCeiling.social - atCeiling.social) - pensionAndUnemploymentOnExtraSalary) < 0.01,
  );
});

test("Germany 2026 phases in solidarity surcharge", () => {
  assert.equal(germanyNet(80_000).tax % 1, 0);
  assert.ok(germanyNet(100_000).tax % 1 > 0);
});
