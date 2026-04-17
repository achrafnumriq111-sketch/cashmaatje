import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

const chartConfig = {
  actual: { label: "Werkelijk", color: "hsl(var(--primary))" },
  predicted: { label: "Voorspeld", color: "hsl(var(--muted-foreground))" },
};

export default function Cashflow() {
  const { orgId, fetchCashflow } = useReportData();
  const [points, setPoints] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    fetchCashflow().then(({ points, upcoming }) => {
      setPoints(points);
      setUpcoming(upcoming);
      setLoading(false);
    });
  }, [orgId, fetchCashflow]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  const receivables = upcoming.filter((u: any) => u.type === "receivable");
  const payables = upcoming.filter((u: any) => u.type === "payable");

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.h1 variants={cardVariant} className="text-2xl font-semibold tracking-tight text-foreground">Kasstroomoverzicht</motion.h1>

      {loading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
          <motion.div variants={cardVariant}>
            <Card className="arcory-glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Kasstroomoverzicht</CardTitle>
              </CardHeader>
              <CardContent>
                {points.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={points}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="predicted" stroke="var(--color-predicted)" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nog geen cashflow-gegevens beschikbaar. Importeer banktransacties om te starten.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {[
              { title: "Verwachte ontvangsten", icon: <ArrowDownLeft className="h-4 w-4 text-primary" />, items: receivables, emptyMsg: "Geen openstaande vorderingen", amountClass: "text-primary" },
              { title: "Verwachte betalingen", icon: <ArrowUpRight className="h-4 w-4 text-destructive" />, items: payables, emptyMsg: "Geen openstaande schulden", amountClass: "text-destructive" },
            ].map((section, i) => (
              <motion.div key={i} variants={cardVariant}>
                <Card className="arcory-glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      {section.icon} {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Factuur</TableHead>
                          <TableHead>Relatie</TableHead>
                          <TableHead className="text-right">Bedrag</TableHead>
                          <TableHead className="text-right">Vervaldatum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">{section.emptyMsg}</TableCell>
                          </TableRow>
                        ) : (
                          section.items.map((r: any) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono text-xs">{r.invoiceNumber}</TableCell>
                              <TableCell>{r.contactName ?? "—"}</TableCell>
                              <TableCell className={`text-right tabular-nums ${section.amountClass}`}>{fmt(r.amount)}</TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">{r.dueDate}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
