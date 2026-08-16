import { readFile, writeFile } from "node:fs/promises";

const [zurichPath, genevaPath, outputPath] = process.argv.slice(2);

if (!zurichPath || !genevaPath || !outputPath) {
  throw new Error("Usage: node generate-swiss-tax-rates.mjs <ZH txt> <GE txt> <output ts>");
}

async function readA0Ranges(path, canton) {
  const contents = await readFile(path, "latin1");
  const prefix = `0601${canton}A0N`;

  return contents
    .split(/\r?\n/)
    .filter((line) => line.startsWith(prefix))
    .map((line) => {
      const [, range, rateField] = line.trim().split(/\s+/);
      const minimum = Number(range.slice(8, 17)) / 100;
      const interval = Number(range.slice(17, 26)) / 100;
      const maximum = minimum + interval - 1;
      const rate = Number(rateField.slice(2)) / 100;
      return [minimum, maximum, rate];
    });
}

const zurich = await readA0Ranges(zurichPath, "ZH");
const geneva = await readA0Ranges(genevaPath, "GE");
const banner = `// Generated from the official 2026 cantonal payroll tables.\n// Tariff A0: single, no children, no church tax. Do not edit manually.\n`;
const source = `${banner}export type SwissTaxRange = readonly [minimum: number, maximum: number, rate: number];\n\nexport const ZURICH_A0_2026: readonly SwissTaxRange[] = ${JSON.stringify(zurich)};\n\nexport const GENEVA_A0_2026: readonly SwissTaxRange[] = ${JSON.stringify(geneva)};\n`;

await writeFile(outputPath, source, "utf8");
