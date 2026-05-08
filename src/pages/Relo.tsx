import { lazy, Suspense, useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calculator, Info, CircleDollarSign } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Seo } from "@/components/Seo";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ReloDeepDiveSection = lazy(() =>
  import("@/components/ReloDeepDiveSection").then((module) => ({ default: module.ReloDeepDiveSection }))
);

interface TaxBreakdown {
  grossSalary: number;
  monthlySalary: number;
  standardRemuneration: number;
  employmentIncomeDeduction: number;
  basicDeduction: number;
  dependentDeduction: number;
  totalDeductions: number;
  taxableIncome: number;
  incomeTax: number;
  residentTax: number;
  healthInsurance: number;
  pensionInsurance: number;
  unemploymentInsurance: number;
  nursingCareInsurance: number;
  totalSocialInsurance: number;
  totalTaxes: number;
  takeHomeSalary: number;
  monthlyTakeHome: number;
}

// Prefecture health insurance rates (2025 rates - employee portion is 50% of total)
// Based on: https://funjob.jp/keisan/gekkyu/
const PREFECTURE_HEALTH_RATES: Record<string, number> = {
  "東京都": 0.04935, // Tokyo: ~9.87% total, employee pays ~4.935%
  "神奈川県": 0.04935,
  "埼玉県": 0.04935,
  "千葉県": 0.04935,
  "大阪府": 0.04935,
  "京都府": 0.04935,
  "兵庫県": 0.04935,
  // Default to Tokyo rate if prefecture not specified
};

// Get health insurance rate for prefecture (default to Tokyo)
function getHealthInsuranceRate(prefecture: string): number {
  return PREFECTURE_HEALTH_RATES[prefecture] || 0.04935;
}

// Standard Remuneration (標準報酬月額) - simplified calculation
// In reality, this is determined by salary brackets, but we'll use monthly salary as approximation
function getStandardRemuneration(monthlySalary: number): number {
  // Standard remuneration is typically close to monthly salary
  // For simplicity, we'll use the monthly salary rounded to nearest bracket
  // In practice, there are specific brackets, but this is a good approximation
  return monthlySalary;
}

// Employment Income Deduction (給与所得控除)
// Based on NTA: https://www.nta.go.jp/english/taxes/individual/12001.htm
function getEmploymentIncomeDeduction(annualIncome: number): number {
  if (annualIncome <= 550000) return 0;
  if (annualIncome <= 1800000) return Math.floor(annualIncome * 0.40);
  if (annualIncome <= 3600000) return Math.floor(annualIncome * 0.30 + 180000);
  if (annualIncome <= 6600000) return Math.floor(annualIncome * 0.20 + 540000);
  if (annualIncome <= 8500000) return Math.floor(annualIncome * 0.10 + 1200000);
  return Math.min(1950000, Math.floor(annualIncome * 0.05 + 1700000));
}

// Calculate income tax using withholding tax method
// Simplified calculation based on taxable income
function calculateIncomeTax(taxableIncome: number): number {
  // Progressive tax brackets (2024 rates)
  let tax = 0;
  let remaining = taxableIncome;

  const brackets = [
    { min: 0, max: 1950000, rate: 0.05 },
    { min: 1950000, max: 3300000, rate: 0.10 },
    { min: 3300000, max: 6950000, rate: 0.20 },
    { min: 6950000, max: 9000000, rate: 0.23 },
    { min: 9000000, max: 18000000, rate: 0.33 },
    { min: 18000000, max: 40000000, rate: 0.40 },
    { min: 40000000, max: Infinity, rate: 0.45 },
  ];

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const bracketRange = Math.min(bracket.max - bracket.min, remaining);
    if (bracketRange > 0) {
      tax += bracketRange * bracket.rate;
      remaining -= bracketRange;
    }
  }

  return Math.floor(tax);
}

// Dependent deduction: ¥380,000 per dependent
function getDependentDeduction(dependents: number): number {
  return dependents * 380000;
}

// Calculate social insurance based on standard remuneration
// Based on: https://funjob.jp/keisan/gekkyu/
function calculateSocialInsurance(
  standardRemuneration: number,
  ageRange: string
): {
  health: number;
  pension: number;
  unemployment: number;
  nursingCare: number;
  total: number;
} {
  // Health insurance: Standard remuneration × prefecture rate ÷ 2 (employee portion)
  // Using Tokyo rate as default
  const healthRate = 0.04935; // Employee portion (50% of ~9.87%)
  const health = Math.floor(standardRemuneration * healthRate);

  // Pension insurance: Standard remuneration × 18.300% ÷ 2 (employee portion)
  const pensionRate = 0.0915; // Employee portion (50% of 18.300%)
  const pension = Math.floor(standardRemuneration * pensionRate);

  // Employment insurance: Monthly salary × 5.5/1000 (employee portion for 2025)
  // Note: This is based on actual monthly salary, not standard remuneration
  const unemploymentRate = 0.0055; // 5.5/1000 for employee
  const unemployment = Math.floor(standardRemuneration * unemploymentRate);

  // Nursing care insurance: Standard remuneration × 1.59% ÷ 2 (for age 40-64)
  // Only applies to ages 40-64
  const nursingCareRate = ageRange === "40-64" ? 0.00795 : 0; // Employee portion (50% of 1.59%)
  const nursingCare = Math.floor(standardRemuneration * nursingCareRate);

  return {
    health,
    pension,
    unemployment,
    nursingCare,
    total: health + pension + unemployment + nursingCare,
  };
}

// Resident Tax (Local Tax)
// Year 1: Usually zero (based on previous year's income)
// Year 2+: 10% of taxable income from previous year
function calculateResidentTax(taxableIncome: number, isYear1: boolean): number {
  if (isYear1) {
    return 0; // Year 1: No resident tax for newcomers
  }
  // Year 2+: 10% of taxable income (6% prefectural + 4% municipal)
  return Math.floor(taxableIncome * 0.10);
}

function calculateTaxBreakdown(
  grossSalary: number,
  prefecture: string,
  ageRange: string,
  dependents: number,
  isYear1: boolean
): TaxBreakdown {
  const monthlySalary = Math.floor(grossSalary / 12);
  const standardRemuneration = getStandardRemuneration(monthlySalary);

  // Deductions
  const employmentIncomeDeduction = getEmploymentIncomeDeduction(grossSalary);
  const basicDeduction = 480000; // Standard basic deduction
  const dependentDeduction = getDependentDeduction(dependents);
  const totalDeductions = employmentIncomeDeduction + basicDeduction + dependentDeduction;

  // Taxable Income
  const taxableIncome = Math.max(0, grossSalary - totalDeductions);

  // Taxes
  const incomeTax = calculateIncomeTax(taxableIncome);
  const residentTax = calculateResidentTax(taxableIncome, isYear1);

  // Social Insurance (based on standard remuneration)
  const socialInsurance = calculateSocialInsurance(standardRemuneration, ageRange);

  // Totals
  const totalSocialInsurance = socialInsurance.total;
  const totalTaxes = incomeTax + residentTax + totalSocialInsurance;
  const takeHomeSalary = grossSalary - totalTaxes;
  const monthlyTakeHome = Math.floor(takeHomeSalary / 12);

  return {
    grossSalary,
    monthlySalary,
    standardRemuneration,
    employmentIncomeDeduction,
    basicDeduction,
    dependentDeduction,
    totalDeductions,
    taxableIncome,
    incomeTax,
    residentTax,
    healthInsurance: socialInsurance.health,
    pensionInsurance: socialInsurance.pension,
    unemploymentInsurance: socialInsurance.unemployment,
    nursingCareInsurance: socialInsurance.nursingCare,
    totalSocialInsurance,
    totalTaxes,
    takeHomeSalary,
    monthlyTakeHome,
  };
}

const Relo = () => {
  const [grossSalary, setGrossSalary] = useState(6000000); // Default: 6M JPY
  const [ageRange, setAgeRange] = useState("40-64");
  const [dependents, setDependents] = useState("0");
  const [peopleCount, setPeopleCount] = useState<"1" | "2">("1");
  
  // Woven by Toyota Salary Breakdown state
  const [includeRelocationBonus, setIncludeRelocationBonus] = useState(false);
  const HOUSING_ALLOWANCE = 600000;
  const RETENTION_BONUS = 900000;
  const RELOCATION_BONUS = 1000000;
  const BASIC_RATIO = 0.8;
  const DISCRETIONARY_RATIO = 0.2;
  const PENSION_RATE = 0.075;
  
  // Resources state
  const [resources, setResources] = useState<any[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const { user } = useAuth();

  const year1Breakdown = useMemo(
    () => calculateTaxBreakdown(grossSalary, "東京都", ageRange, parseInt(dependents), true),
    [grossSalary, ageRange, dependents]
  );

  const year2Breakdown = useMemo(
    () => calculateTaxBreakdown(grossSalary, "東京都", ageRange, parseInt(dependents), false),
    [grossSalary, ageRange, dependents]
  );

  // Format number with commas for display
  const formatNumberWithCommas = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Parse comma-formatted string to number
  const parseNumberFromString = (value: string): number => {
    return parseInt(value.replace(/,/g, "")) || 0;
  };

  const [salaryDisplay, setSalaryDisplay] = useState(formatNumberWithCommas(6000000));

  const handleSalaryChange = (value: string) => {
    // Remove commas and non-numeric characters
    const cleaned = value.replace(/[^\d]/g, "");
    const numValue = parseInt(cleaned) || 0;
    setGrossSalary(numValue);
    setSalaryDisplay(formatNumberWithCommas(numValue));
  };

  // Fetch selected resources for Relo page
  useEffect(() => {
    const fetchResources = async () => {
      if (!user) return;
      
      try {
        setResourcesLoading(true);
        // First, get the resource IDs for the Relo page
        const { data: pageResources, error: pageError } = await supabase
          .from('page_resources')
          .select('resource_id')
          .eq('page_identifier', 'relo');

        if (pageError) throw pageError;

        if (!pageResources || pageResources.length === 0) {
          setResources([]);
          setFilteredResources([]);
          setResourcesLoading(false);
          return;
        }

        // Then, fetch the actual resources
        const resourceIds = pageResources.map(pr => pr.resource_id);
        const { data, error } = await supabase
          .from('resources')
          .select('id, title, description, url, category, created_at')
          .in('id', resourceIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setResources(data || []);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setResourcesLoading(false);
      }
    };

    fetchResources();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };


  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Seo
        title="Relocation to Tokyo Guide for Tech Job Seekers"
        description="Estimate Tokyo take-home salary, review relocation resources, and understand the cost of moving to Japan for a technical role."
        path="/relo"
        jsonLd={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Relocation to Tokyo Guide', path: '/relo' },
        ])}
      />
      <NavigationHeader />
      <div className="container mx-auto py-8 px-4 max-w-7xl flex-1">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Relocation to Tokyo Guide' }]} className="mb-4" />
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-4xl">🇯🇵</span> Relocation to Tokyo Guide
        </h1>
        <p className="text-muted-foreground text-lg">
          Estimate take-home salary, compare living costs, and plan your move to Tokyo with a practical guide for English-speaking and bilingual tech candidates.
        </p>
      </div>

      {/* Calculator Input Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Take-home Salary Calculator
          </CardTitle>
          <CardDescription>
            Enter your details to calculate your estimated take-home salary in Japan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gross Salary Input */}
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-base font-semibold">
                Annual Salary (Gross, JPY)
              </Label>
              <Input
                id="salary"
                type="text"
                value={salaryDisplay}
                onChange={(e) => handleSalaryChange(e.target.value)}
                placeholder="6,000,000"
                className="text-right"
              />
            </div>

            {/* Age Range Selection */}
            <div className="space-y-2">
              <Label htmlFor="age" className="text-base font-semibold">
                Age (年齢)
              </Label>
              <Select value={ageRange} onValueChange={setAgeRange}>
                <SelectTrigger id="age">
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-39">39歳以下</SelectItem>
                  <SelectItem value="40-64">40歳〜64歳</SelectItem>
                  <SelectItem value="65+">65歳以上</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dependents Selection */}
            <div className="space-y-2">
              <Label htmlFor="dependents" className="text-base font-semibold">
                Number of Dependents (扶養人数)
              </Label>
              <Select value={dependents} onValueChange={setDependents}>
                <SelectTrigger id="dependents">
                  <SelectValue placeholder="Select number of dependents" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}人
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Year 1 Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5" />
              Year 1 Breakdown
            </CardTitle>
            <CardDescription>
              First year in Japan - resident tax typically zero
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">
                  Estimated Take-home Salary (Annual)
                </div>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(year1Breakdown.takeHomeSalary)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Monthly: {formatCurrency(year1Breakdown.monthlyTakeHome)}
                </div>
              </div>

              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Gross Salary (Annual)</TableCell>
                    <TableCell className="text-right">{formatCurrency(year1Breakdown.grossSalary)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Deductions</TableCell>
                    <TableCell className="text-right text-green-600">
                      -{formatCurrency(year1Breakdown.totalDeductions)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Taxable Income</TableCell>
                    <TableCell className="text-right">{formatCurrency(year1Breakdown.taxableIncome)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-medium">Income Tax (National)</TableCell>
                    <TableCell className="text-right">{formatCurrency(year1Breakdown.incomeTax)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-medium">Resident Tax (Local)</TableCell>
                    <TableCell className="text-right">{formatCurrency(year1Breakdown.residentTax)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-medium">Social Insurance</TableCell>
                    <TableCell className="text-right">{formatCurrency(year1Breakdown.totalSocialInsurance)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t-2">
                    <TableCell>Total Taxes & Deductions</TableCell>
                    <TableCell className="text-right text-red-600">
                      -{formatCurrency(year1Breakdown.totalTaxes)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Year 2 Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5" />
              Year 2+ Breakdown
            </CardTitle>
            <CardDescription>
              Steady-state taxes and deductions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">
                  Estimated Take-home Salary (Annual)
                </div>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(year2Breakdown.takeHomeSalary)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Monthly: {formatCurrency(year2Breakdown.monthlyTakeHome)}
                </div>
              </div>

              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Gross Salary (Annual)</TableCell>
                    <TableCell className="text-right">{formatCurrency(year2Breakdown.grossSalary)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Deductions</TableCell>
                    <TableCell className="text-right text-green-600">
                      -{formatCurrency(year2Breakdown.totalDeductions)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Taxable Income</TableCell>
                    <TableCell className="text-right">{formatCurrency(year2Breakdown.taxableIncome)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-medium">Income Tax (National)</TableCell>
                    <TableCell className="text-right">{formatCurrency(year2Breakdown.incomeTax)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-medium">Resident Tax (Local)</TableCell>
                    <TableCell className="text-right">{formatCurrency(year2Breakdown.residentTax)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-medium">Social Insurance</TableCell>
                    <TableCell className="text-right">{formatCurrency(year2Breakdown.totalSocialInsurance)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t-2">
                    <TableCell>Total Taxes & Deductions</TableCell>
                    <TableCell className="text-right text-red-600">
                      -{formatCurrency(year2Breakdown.totalTaxes)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Suspense
        fallback={
          <Card className="mb-8">
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Loading relocation deep dive…
            </CardContent>
          </Card>
        }
      >
        <ReloDeepDiveSection
          year1Breakdown={year1Breakdown}
          year2Breakdown={year2Breakdown}
          ageRange={ageRange}
          dependents={dependents}
          peopleCount={peopleCount}
          onPeopleCountChange={setPeopleCount}
          resources={resources}
          resourcesLoading={resourcesLoading}
          includeRelocationBonus={includeRelocationBonus}
          onToggleRelocationBonus={() => setIncludeRelocationBonus((value) => !value)}
          grossSalary={grossSalary}
          formatCurrency={formatCurrency}
          housingAllowance={HOUSING_ALLOWANCE}
          retentionBonus={RETENTION_BONUS}
          relocationBonus={RELOCATION_BONUS}
          basicRatio={BASIC_RATIO}
          discretionaryRatio={DISCRETIONARY_RATIO}
          pensionRate={PENSION_RATE}
        />
      </Suspense>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Omiyages. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Relo;
