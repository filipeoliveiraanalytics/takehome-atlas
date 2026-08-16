"use client";

import { useMemo, useState } from "react";

type Country = "nl" | "pt";
type City = "Amsterdam" | "Rotterdam" | "Lisbon" | "Porto";
const cities: Record<Country, City[]> = { nl: ["Amsterdam", "Rotterdam"], pt: ["Lisbon", "Porto"] };
const livingCosts: Record<City, { rent: number; groceries: number; utilities: number; transport: number; leisure: number; childcare: number }> = {
  Amsterdam: { rent: 2100, groceries: 475, utilities: 260, transport: 125, leisure: 350, childcare: 1050 },
  Rotterdam: { rent: 1650, groceries: 450, utilities: 250, transport: 110, leisure: 310, childcare: 950 },
  Lisbon: { rent: 1450, groceries: 350, utilities: 170, transport: 50, leisure: 260, childcare: 480 },
  Porto: { rent: 1100, groceries: 325, utilities: 160, transport: 40, leisure: 230, childcare: 420 },
};

function progressiveTax(income: number, bands: [number, number][]) {
  let tax = 0, previous = 0;
  for (const [ceiling, rate] of bands) {
    tax += Math.max(0, Math.min(income, ceiling) - previous) * rate;
    previous = ceiling;
    if (income <= ceiling) break;
  }
  return tax;
}
function dutchGeneralCredit(income: number) {
  if (income <= 29736) return 3115;
  if (income >= 78426) return 0;
  return 3115 - .06398 * (income - 29736);
}
function dutchLabourCredit(income: number) {
  if (income <= 11965) return .08324 * income;
  if (income <= 25845) return 996 + .31009 * (income - 11965);
  if (income <= 45592) return 5300 + .0195 * (income - 25845);
  if (income <= 132920) return Math.max(0, 5685 - .0651 * (income - 45592));
  return 0;
}
function netherlandsNet(gross: number, ruling: boolean, includeSocialSecurity: boolean) {
  const salaryNorm = 48013;
  const taxFree = ruling ? Math.min(gross * .3, 78600, Math.max(0, gross - salaryNorm)) : 0;
  const taxable = gross - taxFree;
  const payrollTax = progressiveTax(taxable, [[38883, .081], [78426, .3756], [Infinity, .495]]);
  const socialTax = includeSocialSecurity ? Math.min(taxable, 38883) * .2765 : 0;
  const grossTax = payrollTax + socialTax;
  const generalCredit = dutchGeneralCredit(taxable);
  const labourCredit = dutchLabourCredit(taxable);
  const due = Math.max(0, grossTax - generalCredit - labourCredit);
  return { net: gross - due, tax: due, social: socialTax, taxable, taxFree, generalCredit, labourCredit, payrollTax, socialTax };
}
function portugalNet(gross: number, regime: boolean) {
  const social = gross * .11;
  const taxable = Math.max(0, gross - social - 4587);
  const regularTax = progressiveTax(taxable, [[8059,.125],[12160,.16],[17233,.215],[22306,.244],[28400,.314],[41629,.349],[44987,.431],[83696,.446],[Infinity,.48]]);
  const tax = regime ? taxable * .2 : regularTax;
  return { net: gross - social - tax, tax, social, taxable, taxFree: 0, generalCredit: 0, labourCredit: 0, payrollTax: tax, socialTax: social };
}
const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default function Home() {
  const [country, setCountry] = useState<Country>("nl");
  const [city, setCity] = useState<City>("Amsterdam");
  const [salary, setSalary] = useState(72000);
  const [kids, setKids] = useState(0);
  const [regime, setRegime] = useState(true);
  const [rentMode, setRentMode] = useState<"solo" | "share">("solo");
  const [holidayMode, setHolidayMode] = useState<"included" | "onTop">("included");
  const [holidayPayout, setHolidayPayout] = useState<"spread" | "may">("spread");
  const [includeSocialSecurity, setIncludeSocialSecurity] = useState(true);
  const result = useMemo(() => {
    const holidayAllowance = country === "nl" ? (holidayMode === "included" ? salary * (8 / 108) : salary * .08) : 0;
    const baseSalary = country === "nl" && holidayMode === "included" ? salary - holidayAllowance : salary;
    const annualGross = baseSalary + holidayAllowance;
    const payroll = country === "nl" ? netherlandsNet(annualGross, regime, includeSocialSecurity) : portugalNet(annualGross, regime);
    const base = livingCosts[city];
    const rent = rentMode === "share" ? base.rent * .62 : base.rent;
    const health = country === "nl" ? 165 : 45;
    const household = rent + base.groceries + base.utilities + base.transport + base.leisure + health + kids * base.childcare;
    const averageMonthlyNet = payroll.net / 12;
    const holidayNet = holidayAllowance ? holidayAllowance * (payroll.net / annualGross) : 0;
    const monthlyNet = holidayPayout === "may" && holidayAllowance ? (payroll.net - holidayNet) / 12 : averageMonthlyNet;
    return { ...payroll, annualGross, baseSalary, holidayAllowance, holidayNet, averageMonthlyNet, monthlyNet, household, savings: monthlyNet - household, rent, health };
  }, [country, city, salary, kids, regime, rentMode, holidayMode, holidayPayout, includeSocialSecurity]);
  function chooseCountry(next: Country) { setCountry(next); setCity(cities[next][0]); setRegime(true); }
  const costs = livingCosts[city];
  const costRows: [string, number][] = [["Housing", result.rent], ["Groceries", costs.groceries], ["Utilities", costs.utilities], ["Transport", costs.transport], ["Health", result.health], ["Lifestyle", costs.leisure], ...(kids ? [[`Childcare × ${kids}`, costs.childcare * kids] as [string, number]] : [])];

  return <main>
    <nav className="nav"><a className="brand" href="#top"><span className="brandMark">R</span> ROAM</a><div className="navLinks"><a href="#calculator">Calculator</a><a href="#method">Methodology</a></div><button className="saveButton">Save scenario <span>↗</span></button></nav>
    <section className="hero" id="top"><div className="eyebrow"><span>●</span> THE RELOCATION SALARY CALCULATOR</div><h1>Know what’s left<br/>after the move.</h1><p>Compare take-home pay, local living costs and real monthly savings—before you accept the offer.</p><a href="#calculator" className="heroCta">Run your numbers <span>↓</span></a><div className="heroStamp"><b>2026</b><span>Tax rules<br/>& cost data</span></div></section>
    <section className="calculator" id="calculator">
      <div className="sectionHead"><div><span className="step">01</span><h2>Build your scenario</h2></div><p>Indicative annual tax calculation for an employee under retirement age.</p></div>
      <div className="workspace">
        <form className="inputs" onSubmit={e => e.preventDefault()}>
          <label className="fieldLabel">COUNTRY</label><div className="countryToggle"><button type="button" className={country === "nl" ? "active" : ""} onClick={() => chooseCountry("nl")}><span>NL</span> Netherlands</button><button type="button" className={country === "pt" ? "active" : ""} onClick={() => chooseCountry("pt")}><span>PT</span> Portugal</button></div>
          <div className="twoCol"><label><span className="fieldLabel">CITY</span><select value={city} onChange={e => setCity(e.target.value as City)}>{cities[country].map(item => <option key={item}>{item}</option>)}</select></label><label><span className="fieldLabel">CHILDREN</span><select value={kids} onChange={e => setKids(Number(e.target.value))}><option value="0">No children</option><option value="1">1 child</option><option value="2">2 children</option><option value="3">3 children</option></select></label></div>
          <label className="salaryField"><span className="fieldLabel">GROSS ANNUAL SALARY</span><span className="salaryInput"><i>€</i><input aria-label="Gross annual salary" type="number" min="10000" step="1000" value={salary} onChange={e => setSalary(Number(e.target.value))}/><em>/ year</em></span></label><input className="range" aria-label="Salary slider" type="range" min="20000" max="180000" step="1000" value={salary} onChange={e => setSalary(Number(e.target.value))}/><div className="rangeEnds"><span>€20k</span><span>€180k</span></div>
          {country === "nl" && <div className="holidayCard"><div className="holidayHead"><span><span className="fieldLabel">8% HOLIDAY ALLOWANCE</span><small>Is vakantiegeld already part of the salary above?</small></span><div className="segmented"><button type="button" className={holidayMode === "included" ? "selected" : ""} onClick={() => setHolidayMode("included")}>Included</button><button type="button" className={holidayMode === "onTop" ? "selected" : ""} onClick={() => setHolidayMode("onTop")}>Paid on top</button></div></div><div className="holidayPayout"><span>Payment timing</span><div className="segmented"><button type="button" className={holidayPayout === "spread" ? "selected" : ""} onClick={() => setHolidayPayout("spread")}>Spread over 12</button><button type="button" className={holidayPayout === "may" ? "selected" : ""} onClick={() => setHolidayPayout("may")}>Paid in May</button></div></div></div>}
          {country === "nl" ? <section className="dutchTaxCard"><div className="taxCardTitle"><span className="fieldLabel">DUTCH TAX SETTINGS</span><small>Adjust what applies to your offer.</small></div><div className="taxSettingRow"><span><b>30% ruling</b><small>Up to 30% of qualifying pay may be tax-free.</small></span><button type="button" role="switch" aria-label="Apply 30% ruling" aria-checked={regime} className={`switch ${regime ? "on" : ""}`} onClick={() => setRegime(!regime)}><span/></button></div><div className="taxSettingRow"><span><b>National insurance</b><small>AOW, Anw and Wlz contributions</small></span><button type="button" role="switch" aria-label="Include national insurance" aria-checked={includeSocialSecurity} className={`switch ${includeSocialSecurity ? "on" : ""}`} onClick={() => setIncludeSocialSecurity(!includeSocialSecurity)}><span/></button></div><div className="eligibility"><span className="infoMark">i</span><p><b>Who may qualify?</b> Generally, employees recruited from abroad with scarce expertise who lived more than 150 km from the Dutch border for over 16 of the previous 24 months. The 2026 taxable-salary norm is €48,013 (€36,497 if under 30 with a qualifying master’s); qualifying researchers may be exempt. Your employer applies with you.</p></div></section> : <div className="regimeCard"><div><span className="fieldLabel">EXPAT TAX REGIME</span><strong>IFICI (NHR 2.0)</strong><small>20% rate on eligible Portuguese-source employment income.</small></div><button type="button" role="switch" aria-label="Apply IFICI" aria-checked={regime} className={`switch ${regime ? "on" : ""}`} onClick={() => setRegime(!regime)}><span/></button></div>}
          <div className="housingRow"><span><b>Housing</b><small>How will you live?</small></span><div><button type="button" className={rentMode === "solo" ? "selected" : ""} onClick={() => setRentMode("solo")}>My own place</button><button type="button" className={rentMode === "share" ? "selected" : ""} onClick={() => setRentMode("share")}>Shared</button></div></div>
        </form>
        <aside className="results" aria-live="polite">
          <div className="resultTop"><span>YOUR ESTIMATED MONTHLY OUTCOME</span><b>{city}, {country.toUpperCase()}</b></div><div className="netBlock"><small>{holidayPayout === "may" && result.holidayAllowance ? "REGULAR-MONTH NET" : "NET INCOME"}</small><strong>{euro.format(result.monthlyNet)}</strong><span>{holidayPayout === "may" && result.holidayAllowance ? `per regular month · May adds about ${euro.format(result.holidayNet)} net holiday pay` : "per month · annualized over 12 months"}</span></div>
          <div className="flow"><div><span>{result.holidayAllowance ? "Total gross package" : "Gross salary"}</span><b>{euro.format(result.annualGross/12)}</b></div>{result.holidayAllowance > 0 && <div><span>{holidayMode === "included" ? "Holiday allowance included" : "Holiday allowance on top"}</span><b>{euro.format(result.holidayAllowance/12)}</b></div>}<div><span>Income tax</span><b>− {euro.format(result.tax/12)}</b></div>{country === "pt" && <div><span>Social security</span><b>− {euro.format(result.social/12)}</b></div>}<div><span>Living costs</span><b>− {euro.format(result.household)}</b></div></div>
          {country === "nl" && <details className="payrollBreakdown" open><summary>Monthly net income breakdown <span>⌄</span></summary><div className="payrollRows"><div><span>Gross package</span><b>{euro.format(result.annualGross/12)}</b></div>{result.taxFree > 0 && <div className="muted"><span>Tax-free under 30% ruling</span><b>{euro.format(result.taxFree/12)}</b></div>}<div className="muted"><span>Taxable income</span><b>{euro.format(result.taxable/12)}</b></div><div><span>Payroll tax before credits</span><b>− {euro.format(result.payrollTax/12)}</b></div>{includeSocialSecurity && <div><span>National insurance</span><b>− {euro.format(result.socialTax/12)}</b></div>}<div className="credit"><span>General tax credit</span><b>+ {euro.format(result.generalCredit/12)}</b></div><div className="credit"><span>Labour tax credit</span><b>+ {euro.format(result.labourCredit/12)}</b></div><div className="breakdownTotal"><span>Monthly net income</span><b>{euro.format(result.monthlyNet)}</b></div></div></details>}
          <div className={`savings ${result.savings < 0 ? "negative" : ""}`}><span><small>POSSIBLE SAVINGS</small><b>{euro.format(result.savings)}</b></span><em>{Math.round(result.savings/result.monthlyNet*100)}% of net</em></div>
          <div className="costBreakdown"><div className="costTitle"><b>Monthly cost estimate</b><span>{city} · {rentMode}</span></div>{costRows.map(([name,amount]) => <div className="costRow" key={name}><span>{name}</span><b>{euro.format(amount)}</b></div>)}</div><p className="resultNote">A planning estimate, not tax advice. Pension, benefits, bonuses and personal deductions are excluded.</p>
        </aside>
      </div>
    </section>
    <section className="method" id="method"><div><span className="step">02</span><h2>One offer.<br/>The whole picture.</h2></div><div className="methodGrid"><article><b>01</b><h3>Net pay</h3><p>Progressive income tax, employee contributions and tax credits modeled annually.</p></article><article><b>02</b><h3>Local costs</h3><p>City-level housing, transport, utilities, food, health and childcare assumptions.</p></article><article><b>03</b><h3>Expat regimes</h3><p>See the indicative impact, while keeping eligibility caveats clear and visible.</p></article></div></section>
    <footer><a className="brand" href="#top"><span className="brandMark">R</span> ROAM</a><p>Built for people choosing where life goes next.</p><span>2026 · BETA ESTIMATE</span></footer>
  </main>;
}
