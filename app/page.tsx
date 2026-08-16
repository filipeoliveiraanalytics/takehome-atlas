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
function netherlandsNet(gross: number, ruling: boolean) {
  const taxable = ruling ? gross * .7 : gross;
  const tax = progressiveTax(taxable, [[38883, .3575], [78426, .3756], [Infinity, .495]]);
  const generalCredit = Math.max(0, 3115 - Math.max(0, taxable - 29000) * .066);
  const labourCredit = Math.max(0, Math.min(5599, taxable * .09) - Math.max(0, taxable - 45000) * .065);
  const due = Math.max(0, tax - generalCredit - labourCredit);
  return { net: gross - due, tax: due, social: 0 };
}
function portugalNet(gross: number, regime: boolean) {
  const social = gross * .11;
  const taxable = Math.max(0, gross - social - 4587);
  const regularTax = progressiveTax(taxable, [[8059,.125],[12160,.16],[17233,.215],[22306,.244],[28400,.314],[41629,.349],[44987,.431],[83696,.446],[Infinity,.48]]);
  const tax = regime ? taxable * .2 : regularTax;
  return { net: gross - social - tax, tax, social };
}
const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default function Home() {
  const [country, setCountry] = useState<Country>("nl");
  const [city, setCity] = useState<City>("Amsterdam");
  const [salary, setSalary] = useState(72000);
  const [kids, setKids] = useState(0);
  const [regime, setRegime] = useState(true);
  const [rentMode, setRentMode] = useState<"solo" | "share">("solo");
  const result = useMemo(() => {
    const payroll = country === "nl" ? netherlandsNet(salary, regime) : portugalNet(salary, regime);
    const base = livingCosts[city];
    const rent = rentMode === "share" ? base.rent * .62 : base.rent;
    const health = country === "nl" ? 165 : 45;
    const household = rent + base.groceries + base.utilities + base.transport + base.leisure + health + kids * base.childcare;
    const monthlyNet = payroll.net / 12;
    return { ...payroll, monthlyNet, household, savings: monthlyNet - household, rent, health };
  }, [country, city, salary, kids, regime, rentMode]);
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
          <div className="regimeCard"><div><span className="fieldLabel">EXPAT TAX REGIME</span><strong>{country === "nl" ? "30% ruling" : "IFICI (NHR 2.0)"}</strong><small>{country === "nl" ? "Up to 30% of qualifying pay may be tax-free." : "20% rate on eligible Portuguese-source employment income."}</small></div><button type="button" role="switch" aria-checked={regime} className={`switch ${regime ? "on" : ""}`} onClick={() => setRegime(!regime)}><span/></button></div><p className="eligibility">ⓘ Eligibility is not verified. Employer, role, timing and salary requirements apply.</p>
          <div className="housingRow"><span><b>Housing</b><small>How will you live?</small></span><div><button type="button" className={rentMode === "solo" ? "selected" : ""} onClick={() => setRentMode("solo")}>My own place</button><button type="button" className={rentMode === "share" ? "selected" : ""} onClick={() => setRentMode("share")}>Shared</button></div></div>
        </form>
        <aside className="results" aria-live="polite">
          <div className="resultTop"><span>YOUR ESTIMATED MONTHLY OUTCOME</span><b>{city}, {country.toUpperCase()}</b></div><div className="netBlock"><small>NET INCOME</small><strong>{euro.format(result.monthlyNet)}</strong><span>per month · annualized over 12 months</span></div>
          <div className="flow"><div><span>Gross salary</span><b>{euro.format(salary/12)}</b></div><div><span>Income tax</span><b>− {euro.format(result.tax/12)}</b></div>{country === "pt" && <div><span>Social security</span><b>− {euro.format(result.social/12)}</b></div>}<div><span>Living costs</span><b>− {euro.format(result.household)}</b></div></div>
          <div className={`savings ${result.savings < 0 ? "negative" : ""}`}><span><small>POSSIBLE SAVINGS</small><b>{euro.format(result.savings)}</b></span><em>{Math.round(result.savings/result.monthlyNet*100)}% of net</em></div>
          <div className="costBreakdown"><div className="costTitle"><b>Monthly cost estimate</b><span>{city} · {rentMode}</span></div>{costRows.map(([name,amount]) => <div className="costRow" key={name}><span>{name}</span><b>{euro.format(amount)}</b></div>)}</div><p className="resultNote">A planning estimate, not tax advice. Pension, benefits, bonuses and personal deductions are excluded.</p>
        </aside>
      </div>
    </section>
    <section className="method" id="method"><div><span className="step">02</span><h2>One offer.<br/>The whole picture.</h2></div><div className="methodGrid"><article><b>01</b><h3>Net pay</h3><p>Progressive income tax, employee contributions and tax credits modeled annually.</p></article><article><b>02</b><h3>Local costs</h3><p>City-level housing, transport, utilities, food, health and childcare assumptions.</p></article><article><b>03</b><h3>Expat regimes</h3><p>See the indicative impact, while keeping eligibility caveats clear and visible.</p></article></div></section>
    <footer><a className="brand" href="#top"><span className="brandMark">R</span> ROAM</a><p>Built for people choosing where life goes next.</p><span>2026 · BETA ESTIMATE</span></footer>
  </main>;
}
