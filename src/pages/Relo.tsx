import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calculator, Info, CircleDollarSign, Lock, Unlock } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ResourceCard } from "@/components/ResourceCard";
import { ResourceSkeletonCard } from "@/components/ResourceSkeletonCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const [isWovenSectionUnlocked, setIsWovenSectionUnlocked] = useState(false);
  const [wovenPassword, setWovenPassword] = useState("");
  const HOUSING_ALLOWANCE = 600000;
  const RETENTION_BONUS = 900000;
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
          .select('*')
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Relocation to Tokyo Guide' }]} className="mb-4" />
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-4xl">🇯🇵</span> Relocation to Tokyo Guide
        </h1>
        <p className="text-muted-foreground text-lg">
          Calculate your rough take-home salary and living costs in Tokyo
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

      {/* Detailed Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Detailed Tax Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="deductions">
              <AccordionTrigger>Deductions</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deduction Type</TableHead>
                      <TableHead className="text-right">Amount (JPY)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Employment Income Deduction (給与所得控除)</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year1Breakdown.employmentIncomeDeduction)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Basic Deduction (基礎控除)</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year1Breakdown.basicDeduction)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Dependent Deduction ({parseInt(dependents)} × ¥380,000)</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year1Breakdown.dependentDeduction)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold">
                      <TableCell>Total Deductions</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year1Breakdown.totalDeductions)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="social-insurance">
              <AccordionTrigger>Social Insurance Breakdown</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insurance Type</TableHead>
                      <TableHead className="text-right">Amount (JPY)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Health Insurance (健康保険)</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year1Breakdown.healthInsurance)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pension Insurance (厚生年金保険)</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year1Breakdown.pensionInsurance)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Unemployment Insurance (雇用保険)</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year1Breakdown.unemploymentInsurance)}
                      </TableCell>
                    </TableRow>
                    {ageRange === "40-64" && (
                      <TableRow>
                        <TableCell>Nursing Care Insurance (介護保険)</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(year1Breakdown.nursingCareInsurance)}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="font-bold">
                      <TableCell>Total Social Insurance</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year1Breakdown.totalSocialInsurance)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Cost of Living in Tokyo */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cost of Living in Tokyo</CardTitle>
              <CardDescription>Estimated monthly expenses</CardDescription>
            </div>
            <Tabs value={peopleCount} onValueChange={(v) => setPeopleCount(v as "1" | "2")}>
              <TabsList>
                <TabsTrigger value="1">1 Person</TabsTrigger>
                <TabsTrigger value="2">2 People</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Fixed Costs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-xl">🏠</span>
                  Fixed Costs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Rent ({peopleCount === "1" ? "1LDK" : "2LDK"})
                    </span>
                    <span className="font-medium">{formatCurrency(peopleCount === "1" ? 120000 : 150000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Utilities</span>
                    <span className="font-medium">{formatCurrency(peopleCount === "1" ? 15000 : 20000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Internet</span>
                    <span className="font-medium">{formatCurrency(4500)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Phone Bill</span>
                    <span className="font-medium">{formatCurrency(peopleCount === "1" ? 5000 : 8000)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Monthly</span>
                    <span className="text-lg">
                      {formatCurrency(peopleCount === "1" ? 144500 : 172500)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Living Expenses */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-xl">🛒</span>
                  Living Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Breakfast</span>
                      <span className="font-medium">{formatCurrency(peopleCount === "1" ? 15000 : 30000)}</span>
                    </div>
                    <span className="text-xs text-gray-400 ml-auto">Daily: {formatCurrency(peopleCount === "1" ? 500 : 1000)}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Lunch</span>
                      <span className="font-medium">{formatCurrency(peopleCount === "1" ? 30000 : 60000)}</span>
                    </div>
                    <span className="text-xs text-gray-400 ml-auto">Daily: {formatCurrency(peopleCount === "1" ? 1000 : 2000)}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Dinner</span>
                      <span className="font-medium">{formatCurrency(peopleCount === "1" ? 30000 : 60000)}</span>
                    </div>
                    <span className="text-xs text-gray-400 ml-auto">Daily: {formatCurrency(peopleCount === "1" ? 1000 : 2000)}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Coffee</span>
                      <span className="font-medium">{formatCurrency(peopleCount === "1" ? 15000 : 30000)}</span>
                    </div>
                    <span className="text-xs text-gray-400 ml-auto">Daily: {formatCurrency(peopleCount === "1" ? 500 : 1000)}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Transportation</span>
                      <span className="font-medium">{formatCurrency(peopleCount === "1" ? 12000 : 24000)}</span>
                    </div>
                    <span className="text-xs text-gray-400 ml-auto">Daily: {formatCurrency(peopleCount === "1" ? 400 : 800)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Monthly</span>
                    <span className="text-lg">{formatCurrency(peopleCount === "1" ? 102000 : 204000)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Entertainment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  Entertainment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Nice Dinner/Drinking x4</span>
                      <span className="font-medium">{formatCurrency(peopleCount === "1" ? 20000 : 40000)}</span>
                    </div>
                    <span className="text-xs text-gray-400 ml-auto">Each Time: {formatCurrency(peopleCount === "1" ? 5000 : 10000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Movie Theater</span>
                    <span className="font-medium">{formatCurrency(peopleCount === "1" ? 1900 : 3800)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gym Membership</span>
                    <span className="font-medium">{formatCurrency(peopleCount === "1" ? 8000 : 16000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Shopping</span>
                    <span className="font-medium">{formatCurrency(peopleCount === "1" ? 30000 : 60000)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Monthly</span>
                    <span className="text-lg">{formatCurrency(peopleCount === "1" ? 59900 : 119800)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Total Monthly Expenses */}
          <div className="bg-primary/10 rounded-lg p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">Total Monthly Expenses</div>
            <div className="text-4xl font-bold text-primary">
              {formatCurrency(peopleCount === "1" ? 306400 : 496300)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Financial Summary
          </CardTitle>
          <CardDescription>Your salary breakdown and savings potential</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Year 1 Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Year 1</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-2">Total Annual Salary (Gross)</div>
                    <div className="text-2xl font-bold">{formatCurrency(year1Breakdown.grossSalary)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Monthly: {formatCurrency(Math.floor(year1Breakdown.grossSalary / 12))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-2">Salary After Tax (Take-home)</div>
                    <div className="text-2xl font-bold text-primary">{formatCurrency(year1Breakdown.takeHomeSalary)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Monthly: {formatCurrency(year1Breakdown.monthlyTakeHome)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-2">Savings After Costs</div>
                    {(() => {
                      const monthlyExpenses = peopleCount === "1" ? 306400 : 496300;
                      const annualExpenses = monthlyExpenses * 12;
                      const savings = year1Breakdown.takeHomeSalary - annualExpenses;
                      return (
                        <>
                          <div className={`text-2xl font-bold ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(savings)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Monthly: {formatCurrency(year1Breakdown.monthlyTakeHome - monthlyExpenses)}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            {formatCurrency(year1Breakdown.takeHomeSalary)} - {formatCurrency(annualExpenses)} = {formatCurrency(savings)}
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Year 2 Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Year 2+</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-2">Total Annual Salary (Gross)</div>
                    <div className="text-2xl font-bold">{formatCurrency(year2Breakdown.grossSalary)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Monthly: {formatCurrency(Math.floor(year2Breakdown.grossSalary / 12))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-2">Salary After Tax (Take-home)</div>
                    <div className="text-2xl font-bold text-primary">{formatCurrency(year2Breakdown.takeHomeSalary)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Monthly: {formatCurrency(year2Breakdown.monthlyTakeHome)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-2">Savings After Costs</div>
                    {(() => {
                      const monthlyExpenses = peopleCount === "1" ? 306400 : 496300;
                      const annualExpenses = monthlyExpenses * 12;
                      const savings = year2Breakdown.takeHomeSalary - annualExpenses;
                      return (
                        <>
                          <div className={`text-2xl font-bold ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(savings)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Monthly: {formatCurrency(year2Breakdown.monthlyTakeHome - monthlyExpenses)}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            {formatCurrency(year2Breakdown.takeHomeSalary)} - {formatCurrency(annualExpenses)} = {formatCurrency(savings)}
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Woven by Toyota Salary Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            Woven by Toyota Salary Breakdown
          </CardTitle>
          <CardDescription>Detailed salary breakdown for Woven by Toyota employees</CardDescription>
        </CardHeader>
        <CardContent>
          {!isWovenSectionUnlocked ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>This section is password protected</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={wovenPassword}
                  onChange={(e) => setWovenPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && wovenPassword === "Namtae123!") {
                      setIsWovenSectionUnlocked(true);
                    }
                  }}
                  className="max-w-xs"
                />
                <Button
                  onClick={() => {
                    if (wovenPassword === "Namtae123!") {
                      setIsWovenSectionUnlocked(true);
                    } else {
                      alert("Incorrect password");
                      setWovenPassword("");
                    }
                  }}
                >
                  Unlock
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-green-600">
                <Unlock className="w-4 h-4" />
                <span className="text-sm">Section unlocked</span>
              </div>

              <Separator />

              {/* Calculations */}
              {(() => {
                const totalAnnual = grossSalary;
                const annualBonusDecimal = 0.20;
                const denominator = 12 * (1 + BASIC_RATIO * annualBonusDecimal + BASIC_RATIO * PENSION_RATE);
                const adjustedAnnual = totalAnnual - HOUSING_ALLOWANCE - RETENTION_BONUS;
                const computedMonthlyBase = denominator > 0 ? adjustedAnnual / denominator : 0;
                const monthlyBase = Math.max(computedMonthlyBase, 0);
                
                const basicSalaryPerMonth = BASIC_RATIO * monthlyBase;
                const discretionaryPerMonth = DISCRETIONARY_RATIO * monthlyBase;
                const annualBonus = annualBonusDecimal * (basicSalaryPerMonth * 12);
                const toyotaPension = PENSION_RATE * (basicSalaryPerMonth * 12);
                const totalBase = monthlyBase * 12;

                return (
                  <Card className="bg-primary/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Total Compensation Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Base</span>
                            <span className="font-medium">{formatCurrency(Math.round(totalBase))}</span>
                          </div>
                          <div className="text-xs text-gray-400 text-right mt-1">
                            Basic salary (80%): {formatCurrency(Math.round(basicSalaryPerMonth * 12))} • Discretionary (20%): {formatCurrency(Math.round(discretionaryPerMonth * 12))}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Annual Bonus</span>
                            <span className="font-medium">{formatCurrency(Math.round(annualBonus))}</span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Toyota Pension</span>
                            <span className="font-medium">{formatCurrency(Math.round(toyotaPension))}</span>
                          </div>
                          <div className="text-xs text-gray-400 text-right mt-1">
                            7.5% of basic salary
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Housing Allowance</span>
                            <span className="font-medium">{formatCurrency(HOUSING_ALLOWANCE)}</span>
                          </div>
                          <div className="text-xs text-gray-400 text-right mt-1">
                            50,000 yen per month
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Retention Bonus</span>
                            <span className="font-medium">{formatCurrency(RETENTION_BONUS)}</span>
                          </div>
                          <div className="text-xs text-gray-400 text-right mt-1">
                            2,700,000 yen vested across 3 years
                          </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span className="text-lg">
                            {formatCurrency(Math.round(totalBase + annualBonus + toyotaPension + HOUSING_ALLOWANCE + RETENTION_BONUS))}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relevant Resources */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Relevant Resources</CardTitle>
          <CardDescription>Helpful resources for relocating to Tokyo</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Resources Grid */}
          {resourcesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <ResourceSkeletonCard key={index} />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No resources found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}

          {!resourcesLoading && resources.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Showing {resources.length} resource{resources.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Relo;
