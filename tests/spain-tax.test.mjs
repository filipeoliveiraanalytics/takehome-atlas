import assert from "node:assert/strict";
import test from "node:test";

import { spainNet } from "../app/tax.ts";

const standardScenarios = [
  { city: "Madrid", gross: 50_000, net: 36_190.21 },
  { city: "Madrid", gross: 80_000, net: 53_852.61 },
  { city: "Madrid", gross: 100_000, net: 65_227.27 },
  { city: "Barcelona", gross: 50_000, net: 35_307.5 },
  { city: "Barcelona", gross: 80_000, net: 52_494.14 },
  { city: "Barcelona", gross: 100_000, net: 63_590.48 },
];

for (const scenario of standardScenarios) {
  test(`Spain 2026: ${scenario.city} standard at €${scenario.gross}`, () => {
    const result = spainNet(scenario.gross, false, scenario.city);
    assert.ok(Math.abs(result.net - scenario.net) < 0.01);
  });
}

for (const [gross, net] of [[50_000, 34_750], [80_000, 56_782.84], [100_000, 71_938.39]]) {
  test(`Spain 2026: Beckham regime at €${gross}`, () => {
    const result = spainNet(gross, true, "Madrid");
    assert.ok(Math.abs(result.net - net) < 0.01);
  });
}

test("Spain 2026 applies employee solidarity contributions above the maximum base", () => {
  const atMaximum = spainNet(61_214.4, true, "Madrid");
  const aboveMaximum = spainNet(62_214.4, true, "Madrid");
  assert.ok(Math.abs((aboveMaximum.social - atMaximum.social) - 1.9) < 0.01);
});
