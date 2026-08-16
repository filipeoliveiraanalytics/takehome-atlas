import assert from "node:assert/strict";
import test from "node:test";
import { italyNet } from "../app/tax.ts";

const cases = [
  [50_000, "Milan", false, 32_568],
  [50_000, "Rome", false, 31_940],
  [80_000, "Milan", false, 47_339],
  [80_000, "Rome", false, 46_251],
  [100_000, "Milan", false, 57_122],
  [100_000, "Rome", false, 55_729],
  [50_000, "Milan", true, 42_272],
  [50_000, "Rome", true, 41_981],
  [80_000, "Milan", true, 63_640],
  [80_000, "Rome", true, 63_169],
  [100_000, "Milan", true, 77_632],
  [100_000, "Rome", true, 77_007],
];

for (const [gross, city, regime, expectedNet] of cases) {
  test(`${city}: EUR ${gross.toLocaleString()} ${regime ? "impatriate" : "standard"}`, () => {
    const result = italyNet(gross, regime, city);
    assert.equal(Math.round(result.net), expectedNet);
  });
}

test("the additional 1% INPS contribution starts above EUR 56,224", () => {
  assert.equal(italyNet(56_224, false, "Milan").social, 56_224 * 0.0919);
  assert.equal(
    italyNet(80_000, false, "Milan").social,
    80_000 * 0.0919 + (80_000 - 56_224) * 0.01,
  );
});
