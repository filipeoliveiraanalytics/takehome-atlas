import assert from "node:assert/strict";
import test from "node:test";

import { portugalNet } from "../app/tax.ts";

const scenarios = [
  { gross: 50_000, ifici: false, annualNet: 33_063.727 },
  { gross: 50_000, ifici: true, annualNet: 35_600 },
  { gross: 80_000, ifici: false, annualNet: 47_886.517 },
  { gross: 80_000, ifici: true, annualNet: 56_960 },
  { gross: 100_000, ifici: false, annualNet: 57_442.273 },
  { gross: 100_000, ifici: true, annualNet: 70_975 },
];

for (const scenario of scenarios) {
  test(`Portugal 2026: €${scenario.gross} ${scenario.ifici ? "IFICI" : "standard"}`, () => {
    const result = portugalNet(scenario.gross, scenario.ifici);

    assert.equal(result.social, scenario.gross * 0.11);
    assert.equal(result.taxable, scenario.gross - result.social);
    assert.ok(Math.abs(result.net - scenario.annualNet) < 0.01);
  });
}

test("Portugal 2026 applies solidarity tax above €80,000 taxable income", () => {
  const result = portugalNet(100_000, true);

  assert.equal(result.taxable, 89_000);
  assert.equal(result.tax, 18_025);
});
