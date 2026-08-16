import {
  GENEVA_A0_2026,
  ZURICH_A0_2026,
  type SwissTaxRange,
} from "./swiss-tax-rates.ts";

type TaxBand = [ceiling: number, rate: number];

const PORTUGAL_2026_BANDS: TaxBand[] = [
  [8_342, 0.125],
  [12_587, 0.157],
  [17_838, 0.212],
  [23_089, 0.241],
  [29_397, 0.311],
  [43_090, 0.349],
  [46_566, 0.431],
  [86_634, 0.446],
  [Infinity, 0.48],
];

function progressiveTax(income: number, bands: TaxBand[]) {
  let tax = 0;
  let previous = 0;

  for (const [ceiling, rate] of bands) {
    tax += Math.max(0, Math.min(income, ceiling) - previous) * rate;
    previous = ceiling;
    if (income <= ceiling) break;
  }

  return tax;
}

function portugalSolidarityTax(taxableIncome: number) {
  const middleBand = Math.max(0, Math.min(taxableIncome, 250_000) - 80_000) * 0.025;
  const topBand = Math.max(0, taxableIncome - 250_000) * 0.05;
  return middleBand + topBand;
}

export function portugalNet(gross: number, ifici: boolean) {
  const social = gross * 0.11;
  // Category A deducts the greater of employee contributions or the statutory
  // specific deduction. At the benchmark salaries, the 11% contribution wins.
  const taxable = Math.max(0, gross - Math.max(social, 4_587));
  const baseTax = ifici
    ? taxable * 0.2
    : progressiveTax(taxable, PORTUGAL_2026_BANDS);
  const solidarityTax = portugalSolidarityTax(taxable);
  const tax = baseTax + solidarityTax;

  return {
    net: gross - social - tax,
    tax,
    social,
    taxable,
    taxFree: 0,
    generalCredit: 0,
    labourCredit: 0,
    payrollTax: tax,
    socialTax: social,
  };
}

function germanyIncomeTax2026(taxableIncome: number) {
  const income = Math.floor(Math.max(0, taxableIncome));

  if (income <= 12_348) return 0;
  if (income <= 17_799) {
    const y = (income - 12_348) / 10_000;
    return (914.51 * y + 1_400) * y;
  }
  if (income <= 69_878) {
    const z = (income - 17_799) / 10_000;
    return (173.1 * z + 2_397) * z + 1_034.87;
  }
  if (income <= 277_825) return 0.42 * income - 11_135.63;
  return 0.45 * income - 19_470.38;
}

export function germanyNet(gross: number) {
  const pensionAndUnemployment = Math.min(gross, 101_400) * 0.106;
  // Employee share: 7.3% health + half of the 2.9% average Zusatzbeitrag,
  // plus 1.8% care insurance and the 0.6% childless surcharge.
  const healthAndCare = Math.min(gross, 69_750) * 0.1115;
  const social = pensionAndUnemployment + healthAndCare;

  // The wage-tax Vorsorgepauschale does not simply deduct all social charges.
  // It includes the 9.3% employee pension share, deductible basic health cover
  // (health share reduced by 4% for sick-pay entitlement), and care insurance.
  const deductiblePension = Math.min(gross, 101_400) * 0.093;
  const deductibleHealthAndCare = Math.min(gross, 69_750) * (0.0875 - 0.073 * 0.04 + 0.024);
  // The BMF payroll procedure's allowances and annual rounding produce a €30
  // lower tariff base than the standalone €1,230 employee expense allowance
  // in this annualized profile. This matches the official 2026 PAP outputs.
  const taxable = Math.max(0, gross - 1_260 - deductiblePension - deductibleHealthAndCare);
  const incomeTax = Math.floor(germanyIncomeTax2026(taxable));

  // 2026 solidarity surcharge: €20,350 exemption threshold followed by the
  // mitigation zone, capped at the regular 5.5% surcharge.
  const solidarity = Math.max(
    0,
    Math.min(incomeTax * 0.055, (incomeTax - 20_350) * 0.119),
  );
  const tax = incomeTax + solidarity;

  return {
    net: gross - social - tax,
    tax,
    social,
    taxable,
    taxFree: 0,
    generalCredit: 0,
    labourCredit: 0,
    payrollTax: tax,
    socialTax: social,
  };
}

function swissWithholdingRate(monthlyGross: number, ranges: readonly SwissTaxRange[]) {
  const range = ranges.find(
    ([minimum, maximum]) => monthlyGross >= minimum && monthlyGross <= maximum,
  );

  // The official schedules stop at CHF 1,000,000 monthly salary. Preserve the
  // final published rate for any out-of-range planning scenario.
  return range?.[2] ?? ranges.at(-1)?.[2] ?? 0;
}

export function switzerlandNet(gross: number, city: "Zurich" | "Geneva") {
  const monthlyGross = gross / 12;
  const ranges = city === "Geneva" ? GENEVA_A0_2026 : ZURICH_A0_2026;
  const withholdingRate = swissWithholdingRate(monthlyGross, ranges);
  const tax = gross * (withholdingRate / 100);

  // Employee assumptions for a single 35-year-old: AHV/IV/EO 5.3%, ALV 1.1%,
  // non-occupational accident insurance 1%, and half of the statutory 10%
  // age-35 BVG retirement credit on the coordinated salary.
  const ahv = gross * 0.053;
  const unemployment = Math.min(gross, 148_200) * 0.011;
  const accident = Math.min(gross, 148_200) * 0.01;
  const coordinatedSalary = gross < 22_680
    ? 0
    : Math.max(3_780, Math.min(gross, 90_720) - 26_460);
  const pension = coordinatedSalary * 0.05;
  const social = ahv + unemployment + accident + pension;

  return {
    net: gross - tax - social,
    tax,
    social,
    taxable: gross,
    taxFree: 0,
    generalCredit: 0,
    labourCredit: 0,
    payrollTax: tax,
    socialTax: social,
  };
}

const SPAIN_STATE_BANDS: TaxBand[] = [
  [12_450, 0.095],
  [20_200, 0.12],
  [35_200, 0.15],
  [60_000, 0.185],
  [300_000, 0.225],
  [Infinity, 0.245],
];

const MADRID_BANDS: TaxBand[] = [
  [13_362.22, 0.085],
  [19_004.63, 0.107],
  [35_425.68, 0.128],
  [57_320.4, 0.174],
  [Infinity, 0.205],
];

const CATALONIA_BANDS: TaxBand[] = [
  [12_500, 0.095],
  [22_000, 0.125],
  [33_000, 0.16],
  [53_000, 0.19],
  [90_000, 0.215],
  [120_000, 0.235],
  [175_000, 0.245],
  [Infinity, 0.255],
];

function spainEmployeeSocialContributions(gross: number) {
  const maximumBase = 61_214.4;
  const firstSolidarityCeiling = 67_335.84;
  const secondSolidarityCeiling = 91_821.6;
  const ordinary = Math.min(gross, maximumBase) * 0.065;
  const solidarityOne = Math.max(0, Math.min(gross, firstSolidarityCeiling) - maximumBase) * 0.0019;
  const solidarityTwo = Math.max(0, Math.min(gross, secondSolidarityCeiling) - firstSolidarityCeiling) * 0.0021;
  const solidarityThree = Math.max(0, gross - secondSolidarityCeiling) * 0.0024;
  return ordinary + solidarityOne + solidarityTwo + solidarityThree;
}

export function spainNet(
  gross: number,
  beckhamRegime: boolean,
  city: "Madrid" | "Barcelona",
) {
  const social = spainEmployeeSocialContributions(gross);
  const taxable = Math.max(0, gross - social - 2_000);

  if (beckhamRegime) {
    const tax = Math.min(gross, 600_000) * 0.24 + Math.max(0, gross - 600_000) * 0.47;
    return {
      net: gross - tax - social,
      tax,
      social,
      taxable: gross,
      taxFree: 0,
      generalCredit: 0,
      labourCredit: 0,
      payrollTax: tax,
      socialTax: social,
    };
  }

  const regionalBands = city === "Barcelona" ? CATALONIA_BANDS : MADRID_BANDS;
  const regionalMinimum = city === "Barcelona" ? 5_550 : 5_956.65;
  const stateTax = progressiveTax(taxable, SPAIN_STATE_BANDS)
    - progressiveTax(5_550, SPAIN_STATE_BANDS);
  const regionalTax = progressiveTax(taxable, regionalBands)
    - progressiveTax(regionalMinimum, regionalBands);
  const tax = Math.max(0, stateTax + regionalTax);

  return {
    net: gross - tax - social,
    tax,
    social,
    taxable,
    taxFree: 0,
    generalCredit: 0,
    labourCredit: 0,
    payrollTax: tax,
    socialTax: social,
  };
}

export function denmarkNet(
  gross: number,
  useExpatScheme: boolean,
  approvedResearcher: boolean,
  city: "Copenhagen" | "Aarhus",
) {
  const atp = 1_188;
  // AM-bidrag is withheld after the employee's ATP contribution.
  const labourMarketContribution = Math.max(0, gross - atp) * 0.08;
  const afterLabourMarketContribution = gross - atp - labourMarketContribution;
  const salaryRouteQualifies = gross >= 65_400 * 12;

  if (useExpatScheme && (approvedResearcher || salaryRouteQualifies)) {
    const tax = afterLabourMarketContribution * 0.27;
    const social = labourMarketContribution + atp;
    return {
      net: gross - tax - social,
      tax,
      social,
      taxable: afterLabourMarketContribution,
      taxFree: 0,
      generalCredit: 0,
      labourCredit: 0,
      payrollTax: tax,
      socialTax: social,
    };
  }

  const personalAllowance = 54_100;
  const employmentAllowance = Math.min(gross * 0.1275, 63_300);
  const jobAllowance = Math.min(Math.max(0, gross - 235_200) * 0.045, 3_100);
  const municipalRate = city === "Aarhus" ? 0.2452 : 0.2339;
  const stateBase = Math.max(0, afterLabourMarketContribution - personalAllowance);
  const municipalBase = Math.max(
    0,
    afterLabourMarketContribution - personalAllowance - employmentAllowance - jobAllowance,
  );
  const stateTax = stateBase * 0.1201
    + Math.max(0, afterLabourMarketContribution - 641_200) * 0.075
    + Math.max(0, afterLabourMarketContribution - 777_900) * 0.075
    + Math.max(0, afterLabourMarketContribution - 2_592_700) * 0.05;
  const municipalTax = municipalBase * municipalRate;
  const tax = stateTax + municipalTax;
  const social = labourMarketContribution + atp;

  return {
    net: gross - tax - social,
    tax,
    social,
    taxable: stateBase,
    taxFree: 0,
    generalCredit: 0,
    labourCredit: 0,
    payrollTax: tax,
    socialTax: social,
  };
}
