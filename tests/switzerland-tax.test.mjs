import assert from "node:assert/strict";
import test from "node:test";

import { switzerlandNet } from "../app/tax.ts";

const scenarios = [
  { city: "Zurich", gross: 50_000, tax: 2_225, net: 42_898 },
  { city: "Zurich", gross: 80_000, tax: 5_968, net: 65_435 },
  { city: "Zurich", gross: 100_000, tax: 8_950, net: 80_437 },
  { city: "Geneva", gross: 50_000, tax: 2_760, net: 42_363 },
  { city: "Geneva", gross: 80_000, tax: 8_848, net: 62_555 },
  { city: "Geneva", gross: 100_000, tax: 13_310, net: 76_077 },
];

for (const scenario of scenarios) {
  test(`Switzerland 2026: ${scenario.city} A0 at CHF ${scenario.gross}`, () => {
    const result = switzerlandNet(scenario.gross, scenario.city);

    assert.ok(Math.abs(result.tax - scenario.tax) < 0.01);
    assert.ok(Math.abs(result.net - scenario.net) < 1);
  });
}

test("Switzerland uses capped ALV/accident and BVG coordinated salary", () => {
  const atBvgCeiling = switzerlandNet(90_720, "Zurich");
  const aboveBvgCeiling = switzerlandNet(91_720, "Zurich");

  // Above the BVG ceiling, only AHV, ALV, and accident contributions grow.
  assert.ok(Math.abs((aboveBvgCeiling.social - atBvgCeiling.social) - 74) < 0.01);
});
