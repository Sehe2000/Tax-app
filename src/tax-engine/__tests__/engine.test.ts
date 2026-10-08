import { describe, expect, it } from 'vitest';
import {
  compareScenarios,
  evaluateMix,
  findOpportunities,
  formatKr,
  formatRange,
  getRules,
  netSalary,
  personalTax,
  salaryForNet,
} from '..';

const rules = getRules(2026);

describe('personalTax', () => {
  it('beregner skatt på 650 000 kr i lønn', () => {
    const r = personalTax({ wage: 650_000 }, rules);
    expect(r.minimumDeduction).toBe(95_700);
    expect(r.generalIncomeTax).toBeCloseTo(96_747.2, 0);
    expect(r.socialSecurity).toBeCloseTo(49_400, 0);
    expect(r.bracketTax).toBeCloseTo(14_835.4, 0);
    expect(r.total).toBeCloseTo(160_982.6, 0);
  });

  it('gir ingen skatt på lav inntekt', () => {
    expect(personalTax({ wage: 90_000 }, rules).total).toBe(0);
  });

  it('bruker høyere trygdeavgift for næringsinntekt', () => {
    const wage = personalTax({ wage: 500_000 }, rules).socialSecurity;
    const business = personalTax({ business: 500_000 }, rules).socialSecurity;
    expect(business).toBeGreaterThan(wage);
  });
});

describe('lønn vs. utbytte', () => {
  it('finner lønn som gir ønsket netto', () => {
    const s = salaryForNet(500_000, rules);
    expect(netSalary(s, rules)).toBeCloseTo(500_000, -1);
  });

  it('gir samme netto i alle scenarier', () => {
    const scenarios = compareScenarios(1_500_000, 500_000, rules);
    for (const s of scenarios) expect(s.mix.netPersonal).toBeCloseTo(500_000, -1);
    const optimal = scenarios.find((s) => s.id === 'optimal')!;
    for (const s of scenarios) expect(optimal.mix.totalTax).toBeLessThanOrEqual(s.mix.totalTax + 1);
  });

  it('markerer fordelinger selskapet ikke har råd til', () => {
    expect(evaluateMix(300_000, 400_000, 0, rules).feasible).toBe(false);
  });
});

describe('findOpportunities', () => {
  it('finner relevante muligheter for en vanlig arbeidstaker', () => {
    const report = findOpportunities({
      userType: 'PRIVATE',
      salary: 650_000,
      situations: ['mortgage', 'commute', 'union', 'bsu', 'donations'],
      interestPaid: 60_000,
      commuteKm: 35,
      unionFee: 6_000,
      bsuDeposit: 27_500,
      donations: 5_000,
    }, rules);
    const ids = report.opportunities.map((o) => o.id);
    expect(ids).toEqual(expect.arrayContaining(['travel-deduction', 'interest', 'union-fee', 'donations']));
    expect(report.totalSavings.max).toBeGreaterThan(report.totalSavings.min);
  });

  it('viser lønn vs. utbytte for AS', () => {
    const report = findOpportunities({
      userType: 'AS',
      profit: 1_200_000,
      takesSalary: true,
      asSalary: 900_000,
      takesDividend: false,
      homeOffice: 'partial',
      paysPrivately: 'yes',
      businessExpenses: ['phone', 'computer', 'software'],
      companyPension: 'no',
    }, rules);
    const ids = report.opportunities.map((o) => o.id);
    expect(ids[0]).toBe('as-salary-dividend');
    expect(ids).toEqual(expect.arrayContaining(['as-equipment', 'as-pension', 'as-home-office']));
  });

  it('viser ENK-kostnader og bil', () => {
    const report = findOpportunities({
      userType: 'ENK',
      profit: 600_000,
      homeOffice: 'dedicated',
      vehicle: 'private',
      businessKm: 4_000,
      businessExpenses: ['phone', 'software'],
      expensesBooked: 'some',
    }, rules);
    const ids = report.opportunities.map((o) => o.id);
    expect(ids).toEqual(expect.arrayContaining(['enk-home-office', 'enk-vehicle', 'enk-phone-internet', 'enk-software']));
    for (const o of report.opportunities) {
      if (o.savings) expect(o.savings.min).toBeLessThanOrEqual(o.savings.max);
    }
  });
});

describe('format', () => {
  it('bruker norsk kroneformat', () => {
    expect(formatKr(45_000)).toBe('45 000 kr');
    expect(formatRange(8_123, 15_456)).toBe('8 100–15 000 kr');
  });
});
