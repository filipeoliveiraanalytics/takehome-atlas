"use client";

import { useMemo, useState } from "react";

type Country = "nl" | "pt" | "de" | "ch" | "es" | "dk" | "it" | "gb";
type City = "Amsterdam" | "Rotterdam" | "Lisbon" | "Porto" | "Berlin" | "Munich" | "Zurich" | "Geneva" | "Madrid" | "Barcelona" | "Copenhagen" | "Aarhus" | "Milan" | "Rome" | "London" | "Manchester";
const countryInfo: Record<Country, { name: string; code: string; currency: string; symbol: string; salary: number; min: number; max: number; step: number; regime?: string; regimeHint?: string }> = {
  nl: { name: "Netherlands", code: "NL", currency: "EUR", symbol: "€", salary: 72000, min: 20000, max: 180000, step: 1000, regime: "30% ruling", regimeHint: "Up to 30% of qualifying pay may be tax-free." },
  pt: { name: "Portugal", code: "PT", currency: "EUR", symbol: "€", salary: 60000, min: 15000, max: 160000, step: 1000, regime: "IFICI (NHR 2.0)", regimeHint: "20% rate on eligible Portuguese-source employment income." },
  de: { name: "Germany", code: "DE", currency: "EUR", symbol: "€", salary: 75000, min: 20000, max: 200000, step: 1000 },
  ch: { name: "Switzerland", code: "CH", currency: "CHF", symbol: "CHF", salary: 110000, min: 40000, max: 300000, step: 2000 },
  es: { name: "Spain", code: "ES", currency: "EUR", symbol: "€", salary: 60000, min: 15000, max: 180000, step: 1000, regime: "Beckham Law", regimeHint: "24% employment-income rate up to €600,000 for eligible inbound workers." },
  dk: { name: "Denmark", code: "DK", currency: "DKK", symbol: "kr", salary: 600000, min: 200000, max: 1800000, step: 10000 },
  it: { name: "Italy", code: "IT", currency: "EUR", symbol: "€", salary: 65000, min: 15000, max: 180000, step: 1000, regime: "Impatriate regime", regimeHint: "Eligible workers may receive a 50% taxable-income exemption." },
  gb: { name: "United Kingdom", code: "UK", currency: "GBP", symbol: "£", salary: 70000, min: 18000, max: 200000, step: 1000 },
};
const countryOrder: Country[] = ["nl", "pt", "de", "ch", "es", "dk", "it", "gb"];
const cities: Record<Country, City[]> = { nl: ["Amsterdam", "Rotterdam"], pt: ["Lisbon", "Porto"], de: ["Berlin", "Munich"], ch: ["Zurich", "Geneva"], es: ["Madrid", "Barcelona"], dk: ["Copenhagen", "Aarhus"], it: ["Milan", "Rome"], gb: ["London", "Manchester"] };
const livingCosts: Record<City, { rent: number; groceries: number; utilities: number; transport: number; leisure: number; childcare: number }> = {
  Amsterdam: { rent: 2100, groceries: 475, utilities: 260, transport: 125, leisure: 350, childcare: 1050 },
  Rotterdam: { rent: 1650, groceries: 450, utilities: 250, transport: 110, leisure: 310, childcare: 950 },
  Lisbon: { rent: 1450, groceries: 350, utilities: 170, transport: 50, leisure: 260, childcare: 480 },
  Porto: { rent: 1100, groceries: 325, utilities: 160, transport: 40, leisure: 230, childcare: 420 },
  Berlin: { rent: 1450, groceries: 390, utilities: 250, transport: 85, leisure: 280, childcare: 350 },
  Munich: { rent: 1950, groceries: 430, utilities: 270, transport: 70, leisure: 320, childcare: 500 },
  Zurich: { rent: 2450, groceries: 650, utilities: 260, transport: 95, leisure: 450, childcare: 1800 },
  Geneva: { rent: 2300, groceries: 670, utilities: 250, transport: 75, leisure: 430, childcare: 1700 },
  Madrid: { rent: 1500, groceries: 360, utilities: 180, transport: 55, leisure: 280, childcare: 550 },
  Barcelona: { rent: 1650, groceries: 370, utilities: 190, transport: 50, leisure: 300, childcare: 600 },
  Copenhagen: { rent: 14500, groceries: 3900, utilities: 1650, transport: 750, leisure: 2800, childcare: 3900 },
  Aarhus: { rent: 10000, groceries: 3600, utilities: 1550, transport: 560, leisure: 2400, childcare: 3400 },
  Milan: { rent: 1650, groceries: 390, utilities: 220, transport: 40, leisure: 300, childcare: 650 },
  Rome: { rent: 1450, groceries: 380, utilities: 220, transport: 35, leisure: 290, childcare: 600 },
  London: { rent: 2300, groceries: 430, utilities: 260, transport: 210, leisure: 390, childcare: 1400 },
  Manchester: { rent: 1300, groceries: 360, utilities: 230, transport: 95, leisure: 300, childcare: 1050 },
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
function germanyNet(gross: number) {
  const taxable = Math.max(0, gross - 1230);
  const x = Math.floor(taxable);
  let incomeTax = 0;
  if (x > 277825) incomeTax = .45*x - 19470.38;
  else if (x > 69878) incomeTax = .42*x - 11135.63;
  else if (x > 17799) { const z=(x-17799)/10000; incomeTax=(173.10*z+2397)*z+1034.87; }
  else if (x > 12348) { const y=(x-12348)/10000; incomeTax=(914.51*y+1400)*y; }
  const social = Math.min(gross, 101400)*.113 + Math.min(gross, 70200)*.1055;
  const solidarity = incomeTax > 40700 ? incomeTax*.055 : 0;
  const tax = Math.max(0,incomeTax+solidarity);
  return { net:gross-tax-social,tax,social,taxable,taxFree:0,generalCredit:0,labourCredit:0,payrollTax:tax,socialTax:social };
}
function spainNet(gross:number, regime:boolean) {
  const social=Math.min(gross,61200)*.0648;
  const taxable=Math.max(0,gross-social-2000);
  const incomeTax=regime ? Math.min(taxable,600000)*.24+Math.max(0,taxable-600000)*.47 : progressiveTax(taxable,[[12450,.19],[20200,.24],[35200,.30],[60000,.37],[300000,.45],[Infinity,.47]]);
  return { net:gross-incomeTax-social,tax:incomeTax,social,taxable,taxFree:regime?gross-taxable:0,generalCredit:0,labourCredit:0,payrollTax:incomeTax,socialTax:social };
}
function italyNet(gross:number, regime:boolean) {
  const social=gross*.0919; const exempt=regime?Math.min(gross*.5,300000):0; const taxable=Math.max(0,gross-social-exempt);
  const national=progressiveTax(taxable,[[28000,.23],[50000,.35],[Infinity,.43]]); const local=taxable*.02; const tax=national+local;
  return { net:gross-tax-social,tax,social,taxable,taxFree:exempt,generalCredit:0,labourCredit:0,payrollTax:tax,socialTax:social };
}
function denmarkNet(grossEur:number) {
  const gross=grossEur, am=gross*.08, afterAm=gross-am, allowance=51600, employment=Math.min(gross*.1275,63471), job=Math.min(Math.max(0,gross-235200)*.045,3100);
  const taxable=Math.max(0,afterAm-allowance-employment-job); const state=taxable*.1201+Math.max(0,afterAm-641200)*.075+Math.max(0,afterAm-777900)*.075+Math.max(0,afterAm-2592700)*.05; const municipal=taxable*.236; const tax=state+municipal, social=am;
  return { net:gross-tax-social,tax,social,taxable,taxFree:0,generalCredit:0,labourCredit:0,payrollTax:tax,socialTax:social };
}
function switzerlandNet(gross:number, city:City) {
  const social=gross*.064; const taxable=Math.max(0,gross-social-5500); const bands=city==="Geneva"?[[30000,.08],[80000,.16],[150000,.24],[Infinity,.30]] as [number,number][]:[[30000,.05],[80000,.12],[150000,.19],[Infinity,.25]] as [number,number][]; const tax=progressiveTax(taxable,bands);
  return { net:gross-tax-social,tax,social,taxable,taxFree:0,generalCredit:0,labourCredit:0,payrollTax:tax,socialTax:social };
}
function ukNet(gross:number) {
  const allowance=Math.max(0,12570-Math.max(0,gross-100000)/2); const taxable=Math.max(0,gross-allowance); const tax=progressiveTax(taxable,[[37700,.20],[125140-allowance,.40],[Infinity,.45]]); const social=Math.max(0,Math.min(gross,50270)-12570)*.08+Math.max(0,gross-50270)*.02;
  return { net:gross-tax-social,tax,social,taxable,taxFree:allowance,generalCredit:0,labourCredit:0,payrollTax:tax,socialTax:social };
}

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
    const payroll = country === "nl" ? netherlandsNet(annualGross, regime, includeSocialSecurity) : country === "pt" ? portugalNet(annualGross, regime) : country === "de" ? germanyNet(annualGross) : country === "es" ? spainNet(annualGross,regime) : country === "it" ? italyNet(annualGross,regime) : country === "dk" ? denmarkNet(annualGross) : country === "gb" ? ukNet(annualGross) : switzerlandNet(annualGross,city);
    const base = livingCosts[city];
    const rent = rentMode === "share" ? base.rent * .62 : base.rent;
    const health = country === "nl" ? 165 : country === "ch" ? 420 : country === "pt" || country === "es" || country === "it" ? 55 : 0;
    const household = rent + base.groceries + base.utilities + base.transport + base.leisure + health + kids * base.childcare;
    const averageMonthlyNet = payroll.net / 12;
    const holidayNet = holidayAllowance ? holidayAllowance * (payroll.net / annualGross) : 0;
    const monthlyNet = holidayPayout === "may" && holidayAllowance ? (payroll.net - holidayNet) / 12 : averageMonthlyNet;
    return { ...payroll, annualGross, baseSalary, holidayAllowance, holidayNet, averageMonthlyNet, monthlyNet, household, savings: monthlyNet - household, rent, health };
  }, [country, city, salary, kids, regime, rentMode, holidayMode, holidayPayout, includeSocialSecurity]);
  const formatter = useMemo(() => new Intl.NumberFormat("en", { style: "currency", currency: countryInfo[country].currency, maximumFractionDigits: 0 }), [country]);
  const money = (value:number) => formatter.format(value);
  const compact = (value:number) => `${countryInfo[country].symbol}${new Intl.NumberFormat("en", { notation:"compact", maximumFractionDigits:0 }).format(value)}`;
  function chooseCountry(next: Country) { setCountry(next); setCity(cities[next][0]); setSalary(countryInfo[next].salary); setRegime(Boolean(countryInfo[next].regime)); }
  const costs = livingCosts[city];
  const costRows: [string, number][] = [["Housing", result.rent], ["Groceries", costs.groceries], ["Utilities", costs.utilities], ["Transport", costs.transport], ["Health", result.health], ["Lifestyle", costs.leisure], ...(kids ? [[`Childcare × ${kids}`, costs.childcare * kids] as [string, number]] : [])];

  return <main>
    <nav className="nav"><a className="brand" href="#top"><span className="brandMark">R</span> ROAM</a><div className="navLinks"><a href="#calculator">Calculator</a><a href="#method">Methodology</a></div><button className="saveButton">Save scenario <span>↗</span></button></nav>
    <section className="hero" id="top"><div className="eyebrow"><span>●</span> NET SALARY, HONESTLY</div><h1>Every offer, converted into <span>what you actually keep.</span></h1><p>Compare take-home pay, expat tax regimes, local living costs and realistic monthly savings before you accept the offer.</p><a href="#calculator" className="heroCta">Run your numbers <span>↓</span></a><div className="heroStamp"><b>2026</b><span>Tax rules<br/>& cost data</span></div></section>
    <section className="calculator" id="calculator">
      <div className="sectionHead"><div><span className="step">01</span><h2>Build your scenario</h2></div><p>Indicative annual tax calculation for an employee under retirement age.</p></div>
      <div className="workspace">
        <form className="inputs" onSubmit={e => e.preventDefault()}>
          <label className="fieldLabel">COUNTRY</label><div className="countryToggle">{countryOrder.map(item => <button type="button" key={item} className={country === item ? "active" : ""} onClick={() => chooseCountry(item)}><span>{countryInfo[item].code}</span>{countryInfo[item].name}</button>)}</div>
          <div className="twoCol"><label><span className="fieldLabel">CITY</span><select value={city} onChange={e => setCity(e.target.value as City)}>{cities[country].map(item => <option key={item}>{item}</option>)}</select></label><label><span className="fieldLabel">CHILDREN</span><select value={kids} onChange={e => setKids(Number(e.target.value))}><option value="0">No children</option><option value="1">1 child</option><option value="2">2 children</option><option value="3">3 children</option></select></label></div>
          <label className="salaryField"><span className="fieldLabel">GROSS ANNUAL SALARY · {countryInfo[country].currency}</span><span className="salaryInput"><i>{countryInfo[country].symbol}</i><input aria-label="Gross annual salary" type="number" min={countryInfo[country].min} step={countryInfo[country].step} value={salary} onChange={e => setSalary(Number(e.target.value))}/><em>/ year</em></span></label><input className="range" aria-label="Salary slider" type="range" min={countryInfo[country].min} max={countryInfo[country].max} step={countryInfo[country].step} value={salary} onChange={e => setSalary(Number(e.target.value))}/><div className="rangeEnds"><span>{compact(countryInfo[country].min)}</span><span>{compact(countryInfo[country].max)}</span></div>
          {country === "nl" && <div className="holidayCard"><div className="holidayHead"><span><span className="fieldLabel">8% HOLIDAY ALLOWANCE</span><small>Is vakantiegeld already part of the salary above?</small></span><div className="segmented"><button type="button" className={holidayMode === "included" ? "selected" : ""} onClick={() => setHolidayMode("included")}>Included</button><button type="button" className={holidayMode === "onTop" ? "selected" : ""} onClick={() => setHolidayMode("onTop")}>Paid on top</button></div></div><div className="holidayPayout"><span>Payment timing</span><div className="segmented"><button type="button" className={holidayPayout === "spread" ? "selected" : ""} onClick={() => setHolidayPayout("spread")}>Spread over 12</button><button type="button" className={holidayPayout === "may" ? "selected" : ""} onClick={() => setHolidayPayout("may")}>Paid in May</button></div></div></div>}
          {country === "nl" ? <section className="dutchTaxCard"><div className="taxCardTitle"><span className="fieldLabel">DUTCH TAX SETTINGS</span><small>Adjust what applies to your offer.</small></div><div className="taxSettingRow"><span><b>30% ruling</b><small>Up to 30% of qualifying pay may be tax-free.</small></span><button type="button" role="switch" aria-label="Apply 30% ruling" aria-checked={regime} className={`switch ${regime ? "on" : ""}`} onClick={() => setRegime(!regime)}><span/></button></div><div className="taxSettingRow"><span><b>National insurance</b><small>AOW, Anw and Wlz contributions</small></span><button type="button" role="switch" aria-label="Include national insurance" aria-checked={includeSocialSecurity} className={`switch ${includeSocialSecurity ? "on" : ""}`} onClick={() => setIncludeSocialSecurity(!includeSocialSecurity)}><span/></button></div><div className="eligibility"><span className="infoMark">i</span><p><b>Who may qualify?</b> Generally, employees recruited from abroad with scarce expertise who lived more than 150 km from the Dutch border for over 16 of the previous 24 months. The 2026 taxable-salary norm is €48,013 (€36,497 if under 30 with a qualifying master’s); qualifying researchers may be exempt. Your employer applies with you.</p></div></section> : countryInfo[country].regime ? <div className="regimeCard"><div><span className="fieldLabel">EXPAT TAX REGIME</span><strong>{countryInfo[country].regime}</strong><small>{countryInfo[country].regimeHint}</small></div><button type="button" role="switch" aria-label={`Apply ${countryInfo[country].regime}`} aria-checked={regime} className={`switch ${regime ? "on" : ""}`} onClick={() => setRegime(!regime)}><span/></button></div> : <div className="standardCard"><span className="fieldLabel">TAX TREATMENT</span><b>Standard resident taxation</b><small>{country === "ch" ? "Income tax varies by canton and municipality; the selected city drives this estimate." : country === "dk" ? "Includes 8% labour-market contribution, state tax and an indicative municipal rate." : "Single employee estimate without church tax or optional personal deductions."}</small></div>}
          <div className="housingRow"><span><b>Housing</b><small>How will you live?</small></span><div><button type="button" className={rentMode === "solo" ? "selected" : ""} onClick={() => setRentMode("solo")}>My own place</button><button type="button" className={rentMode === "share" ? "selected" : ""} onClick={() => setRentMode("share")}>Shared</button></div></div>
        </form>
        <aside className="results" aria-live="polite">
          <div className="resultTop"><span>YOUR ESTIMATED MONTHLY OUTCOME</span><b>{city}, {countryInfo[country].code} · {countryInfo[country].currency}</b></div><div className="netBlock"><small>{holidayPayout === "may" && result.holidayAllowance ? "REGULAR-MONTH NET" : "NET INCOME"}</small><strong>{money(result.monthlyNet)}</strong><span>{holidayPayout === "may" && result.holidayAllowance ? `per regular month · May adds about ${money(result.holidayNet)} net holiday pay` : "per month · annualized over 12 months"}</span><div className="summaryStats"><div><small>Annual net</small><b>{money(result.net)}</b></div><div><small>Effective tax</small><b>{Math.round(result.tax / result.annualGross * 100)}%</b></div><div><small>Gross package</small><b>{money(result.annualGross)}</b></div></div></div>
          <div className="flow"><div><span>{result.holidayAllowance ? "Total gross package" : "Gross salary"}</span><b>{money(result.annualGross/12)}</b></div>{result.holidayAllowance > 0 && <div><span>{holidayMode === "included" ? "Holiday allowance included" : "Holiday allowance on top"}</span><b>{money(result.holidayAllowance/12)}</b></div>}<div><span>Income tax</span><b>− {money(result.tax/12)}</b></div>{country !== "nl" && <div><span>Employee social contributions</span><b>− {money(result.social/12)}</b></div>}<div><span>Living costs</span><b>− {money(result.household)}</b></div></div>
          {country === "nl" && <details className="payrollBreakdown" open><summary>Monthly net income breakdown <span>⌄</span></summary><div className="payrollRows"><div><span>Gross package</span><b>{money(result.annualGross/12)}</b></div>{result.taxFree > 0 && <div className="muted"><span>Tax-free under 30% ruling</span><b>{money(result.taxFree/12)}</b></div>}<div className="muted"><span>Taxable income</span><b>{money(result.taxable/12)}</b></div><div><span>Payroll tax before credits</span><b>− {money(result.payrollTax/12)}</b></div>{includeSocialSecurity && <div><span>National insurance</span><b>− {money(result.socialTax/12)}</b></div>}<div className="credit"><span>General tax credit</span><b>+ {money(result.generalCredit/12)}</b></div><div className="credit"><span>Labour tax credit</span><b>+ {money(result.labourCredit/12)}</b></div><div className="breakdownTotal"><span>Monthly net income</span><b>{money(result.monthlyNet)}</b></div></div></details>}
          <div className={`savings ${result.savings < 0 ? "negative" : ""}`}><span><small>POSSIBLE SAVINGS</small><b>{money(result.savings)}</b></span><em>{Math.round(result.savings/result.monthlyNet*100)}% of net</em></div>
          <div className="costBreakdown"><div className="costTitle"><b>Monthly cost estimate</b><span>{city} · {rentMode}</span></div><div className="costMeter"><span style={{width: `${Math.min(100, Math.max(0, result.household / result.monthlyNet * 100))}%`}}/></div><div className="costShare">Living costs use approximately {Math.round(result.household / result.monthlyNet * 100)}% of net income</div>{costRows.map(([name,amount]) => <div className="costRow" key={name}><span>{name}</span><b>{money(amount)}</b></div>)}</div><p className="resultNote">A planning estimate in local currency, not tax advice. Local, family, pension, benefit and personal-deduction rules may materially change the result.</p>
        </aside>
      </div>
    </section>
    <section className="method" id="method"><div><span className="step">02</span><h2>One offer.<br/>The whole picture.</h2></div><div className="methodGrid"><article><b>01</b><h3>Net pay</h3><p>Progressive income tax, employee contributions and tax credits modeled annually.</p></article><article><b>02</b><h3>Local costs</h3><p>City-level housing, transport, utilities, food, health and childcare assumptions.</p></article><article><b>03</b><h3>Expat regimes</h3><p>See the indicative impact, while keeping eligibility caveats clear and visible.</p></article></div></section>
    <footer><a className="brand" href="#top"><span className="brandMark">R</span> ROAM</a><p>Built for people choosing where life goes next.</p><span>2026 · BETA ESTIMATE</span></footer>
  </main>;
}
