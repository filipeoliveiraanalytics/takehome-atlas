import assert from "node:assert/strict";
import test from "node:test";

import { denmarkNet } from "../app/tax.ts";

const standardScenarios = [
  { city: "Copenhagen", gross: 500_000, net: 331_136.31 },
  { city: "Copenhagen", gross: 800_000, net: 502_404.28 },
  { city: "Copenhagen", gross: 1_000_000, net: 596_892.75 },
  { city: "Aarhus", gross: 500_000, net: 327_312.31 },
  { city: "Aarhus", gross: 800_000, net: 495_461.48 },
  { city: "Aarhus", gross: 1_000_000, net: 587_870.75 },
];

for (const scenario of standardScenarios) {
  test(`Denmark 2026: ${scenario.city} standard at DKK ${scenario.gross}`, () => {
    const result = denmarkNet(scenario.gross, false, false, scenario.city);
    assert.ok(Math.abs(result.net - scenario.net) < 0.01);
  });
}

test("Denmark researcher scheme applies without the highly paid salary threshold", () => {
  const result = denmarkNet(500_000, true, true, "Copenhagen");
  assert.ok(Math.abs(result.net - 335_002.14) < 0.01);
});

test("Denmark highly paid employee scheme applies when the salary test is met", () => {
  const result = denmarkNet(800_000, true, false, "Copenhagen");
  assert.ok(Math.abs(result.net - 536_482.14) < 0.01);
});

test("Denmark scheme falls back to standard tax when neither route qualifies", () => {
  assert.deepEqual(
    denmarkNet(500_000, true, false, "Copenhagen"),
    denmarkNet(500_000, false, false, "Copenhagen"),
  );
});

test("Denmark deducts ATP before calculating the 8% labour-market contribution", () => {
  const result = denmarkNet(500_000, true, true, "Copenhagen");
  assert.ok(Math.abs(result.social - 41_092.96) < 0.01);
});
