import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResourceCard } from "@/components/ResourceCard";
import { ResourceSkeletonCard } from "@/components/ResourceSkeletonCard";

type TaxBreakdown = {
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
};

type Resource = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  created_at: string;
};

interface ReloDeepDiveSectionProps {
  year1Breakdown: TaxBreakdown;
  year2Breakdown: TaxBreakdown;
  ageRange: string;
  dependents: string;
  peopleCount: "1" | "2";
  onPeopleCountChange: (value: "1" | "2") => void;
  resources: Resource[];
  resourcesLoading: boolean;
  includeRelocationBonus: boolean;
  onToggleRelocationBonus: () => void;
  grossSalary: number;
  formatCurrency: (amount: number) => string;
  housingAllowance: number;
  retentionBonus: number;
  relocationBonus: number;
  basicRatio: number;
  discretionaryRatio: number;
  pensionRate: number;
}

export function ReloDeepDiveSection({
  year1Breakdown,
  year2Breakdown,
  ageRange,
  dependents,
  peopleCount,
  onPeopleCountChange,
  resources,
  resourcesLoading,
  includeRelocationBonus,
  onToggleRelocationBonus,
  grossSalary,
  formatCurrency,
  housingAllowance,
  retentionBonus,
  relocationBonus,
  basicRatio,
  discretionaryRatio,
  pensionRate,
}: ReloDeepDiveSectionProps) {
  return (
    <>
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
                      <TableCell className="text-right">{formatCurrency(year1Breakdown.basicDeduction)}</TableCell>
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
                      <TableCell className="text-right">{formatCurrency(year1Breakdown.healthInsurance)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pension Insurance (厚生年金保険)</TableCell>
                      <TableCell className="text-right">{formatCurrency(year1Breakdown.pensionInsurance)}</TableCell>
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

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cost of Living in Tokyo</CardTitle>
              <CardDescription>Estimated monthly expenses</CardDescription>
            </div>
            <Tabs value={peopleCount} onValueChange={(value) => onPeopleCountChange(value as "1" | "2")}>
              <TabsList>
                <TabsTrigger value="1">1 Person</TabsTrigger>
                <TabsTrigger value="2">2 People</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
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
                    <span className="text-sm text-muted-foreground">Rent ({peopleCount === "1" ? "1LDK" : "2LDK"})</span>
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
                    <span className="text-lg">{formatCurrency(peopleCount === "1" ? 144500 : 172500)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-xl">🛒</span>
                  Living Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Breakfast", monthly: peopleCount === "1" ? 15000 : 30000, daily: peopleCount === "1" ? 500 : 1000 },
                    { label: "Lunch", monthly: peopleCount === "1" ? 30000 : 60000, daily: peopleCount === "1" ? 1000 : 2000 },
                    { label: "Dinner", monthly: peopleCount === "1" ? 30000 : 60000, daily: peopleCount === "1" ? 1000 : 2000 },
                    { label: "Coffee", monthly: peopleCount === "1" ? 15000 : 30000, daily: peopleCount === "1" ? 500 : 1000 },
                    { label: "Transportation", monthly: peopleCount === "1" ? 12000 : 24000, daily: peopleCount === "1" ? 400 : 800 },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{formatCurrency(item.monthly)}</span>
                      </div>
                      <span className="text-xs text-neutral-400 ml-auto">Daily: {formatCurrency(item.daily)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Monthly</span>
                    <span className="text-lg">{formatCurrency(peopleCount === "1" ? 102000 : 204000)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <span className="text-xs text-neutral-400 ml-auto">
                      Each Time: {formatCurrency(peopleCount === "1" ? 5000 : 10000)}
                    </span>
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

          <div className="bg-primary/10 rounded-lg p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">Total Monthly Expenses</div>
            <div className="text-4xl font-bold text-primary">
              {formatCurrency(peopleCount === "1" ? 306400 : 496300)}
            </div>
          </div>
        </CardContent>
      </Card>

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
            {[
              { label: "Year 1", breakdown: year1Breakdown },
              { label: "Year 2+", breakdown: year2Breakdown },
            ].map(({ label, breakdown }) => {
              const monthlyExpenses = peopleCount === "1" ? 306400 : 496300;
              const annualExpenses = monthlyExpenses * 12;
              const savings = breakdown.takeHomeSalary - annualExpenses;

              return (
                <div key={label} className="space-y-4">
                  <h3 className="text-lg font-semibold">{label}</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-2">Total Annual Salary (Gross)</div>
                        <div className="text-2xl font-bold">{formatCurrency(breakdown.grossSalary)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Monthly: {formatCurrency(Math.floor(breakdown.grossSalary / 12))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-2">Salary After Tax (Take-home)</div>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(breakdown.takeHomeSalary)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Monthly: {formatCurrency(breakdown.monthlyTakeHome)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-2">Savings After Costs</div>
                        <div className={`text-2xl font-bold ${savings >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(savings)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Monthly: {formatCurrency(breakdown.monthlyTakeHome - monthlyExpenses)}
                        </div>
                        <div className="text-xs text-neutral-400 mt-2">
                          {formatCurrency(breakdown.takeHomeSalary)} - {formatCurrency(annualExpenses)} = {formatCurrency(savings)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            Woven by Toyota Salary Breakdown
          </CardTitle>
          <CardDescription>Detailed salary breakdown for Woven by Toyota employees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-end">
              <Button variant={includeRelocationBonus ? "default" : "outline"} size="sm" onClick={onToggleRelocationBonus}>
                International Relocation
              </Button>
            </div>

            <Separator />

            {(() => {
              const totalAnnual = grossSalary;
              const annualBonusDecimal = 0.2;
              const denominator = 12 * (1 + basicRatio * annualBonusDecimal + basicRatio * pensionRate);
              const adjustedAnnual = totalAnnual - housingAllowance - retentionBonus;
              const computedMonthlyBase = denominator > 0 ? adjustedAnnual / denominator : 0;
              const monthlyBase = Math.max(computedMonthlyBase, 0);

              const basicSalaryPerMonth = basicRatio * monthlyBase;
              const discretionaryPerMonth = discretionaryRatio * monthlyBase;
              const annualBonus = annualBonusDecimal * (basicSalaryPerMonth * 12);
              const toyotaPension = pensionRate * (basicSalaryPerMonth * 12);
              const totalBase = monthlyBase * 12;
              const totalWithoutRelocation =
                totalBase + annualBonus + toyotaPension + housingAllowance + retentionBonus;
              const showLevel4 = totalWithoutRelocation >= 8000000 && totalWithoutRelocation <= 14500000;

              if (!showLevel4) {
                return (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center text-muted-foreground">
                        <p className="text-lg">Calculation is only available for Level 4 at the moment</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Total Compensation Breakdown</CardTitle>
                      <Badge variant="secondary" className="ml-auto">
                        Level 4
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex flex-col">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Base</span>
                          <span className="font-medium">{formatCurrency(Math.round(totalBase))}</span>
                        </div>
                        <div className="text-xs text-right mt-1 space-y-0.5">
                          <div className="text-cyan-500">
                            Basic salary (80%): {formatCurrency(Math.round(basicSalaryPerMonth * 12))}
                          </div>
                          <div className="text-neutral-400">
                            Discretionary (20%): {formatCurrency(Math.round(discretionaryPerMonth * 12))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Annual Bonus</span>
                          <span className="font-medium">{formatCurrency(Math.round(annualBonus))}</span>
                        </div>
                        <div className="text-xs text-neutral-400 text-right mt-1">
                          20% of the basic salary, paid once a year
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Toyota Pension</span>
                          <span className="font-medium">{formatCurrency(Math.round(toyotaPension))}</span>
                        </div>
                        <div className="text-xs text-neutral-400 text-right mt-1">
                          7.5% of basic salary
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Housing Allowance</span>
                          <span className="font-medium">{formatCurrency(housingAllowance)}</span>
                        </div>
                        <div className="text-xs text-neutral-400 text-right mt-1">
                          50,000 yen per month
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Retention Bonus</span>
                          <span className="font-medium">{formatCurrency(retentionBonus)}</span>
                        </div>
                        <div className="text-xs text-neutral-400 text-right mt-1">
                          2,700,000 yen vested across 3 years
                        </div>
                      </div>
                      {includeRelocationBonus && (
                        <div className="flex flex-col">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Relocation Bonus</span>
                            <span className="font-medium">{formatCurrency(relocationBonus)}</span>
                          </div>
                          <div className="text-xs text-neutral-400 text-right mt-1">
                            1 time bonus that is paid in the 2nd month paycheck
                          </div>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-lg">
                          {formatCurrency(Math.round(totalWithoutRelocation + (includeRelocationBonus ? relocationBonus : 0)))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Relevant Resources</CardTitle>
          <CardDescription>Helpful resources for relocating to Tokyo</CardDescription>
        </CardHeader>
        <CardContent>
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
                Showing {resources.length} resource{resources.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
