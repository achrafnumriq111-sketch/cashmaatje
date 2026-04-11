import { useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { ActionItems } from "@/components/dashboard/ActionItems";
import { CashPosition } from "@/components/dashboard/CashPosition";
import { OpenItems } from "@/components/dashboard/OpenItems";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";
import { PeriodSelector, getDefaultPeriod, type DateRange } from "@/components/dashboard/PeriodSelector";

export default function Dashboard() {
  const [period, setPeriod] = useState<DateRange>(getDefaultPeriod);
  const data = useDashboardData({ from: period.from, to: period.to });
  const latest = data.healthSnapshot.data?.[0];
  const burn = data.burnRate.data;
  const openInv = data.openInvoices.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.role === "entrepreneur" ? "Overzicht van je bedrijf" : "Financieel overzicht"}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <KpiCards
        cashBalance={burn?.cashBalance}
        monthlyRevenue={burn?.monthlyRevenue}
        monthlyBurn={burn?.monthlyBurn}
        netProfit={burn?.netProfit}
        grossMargin={burn?.grossMargin}
        cashRunwayMonths={burn?.cashRunwayMonths}
        isLoading={data.burnRate.isLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RevenueChart data={data.monthlyRevenue.data} isLoading={data.monthlyRevenue.isLoading} />
        </div>
        <div className="lg:col-span-2">
          <HealthScore snapshot={latest} isLoading={data.healthSnapshot.isLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CashPosition
          accounts={data.bankBalances.data ?? []}
          isLoading={data.bankBalances.isLoading}
        />
        <OpenItems
          receivable={openInv?.receivable ?? 0}
          payable={openInv?.payable ?? 0}
          overdueReceivable={openInv?.overdueReceivable ?? 0}
          overduePayable={openInv?.overduePayable ?? 0}
          isLoading={data.openInvoices.isLoading}
        />
        <ActionItems
          unreconciledCount={data.unreconciledCount.data ?? 0}
          missingDocsCount={data.missingDocsCount.data ?? 0}
          pendingDocsCount={data.pendingDocsCount.data ?? 0}
          anomaliesCount={data.anomaliesCount.data ?? 0}
          vatDeadline={data.vatDeadline.data}
          role={data.role}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions
          transactions={data.recentTransactions.data ?? []}
          isLoading={data.recentTransactions.isLoading}
          role={data.role}
        />
        <RecentDocuments
          documents={data.recentDocuments.data ?? []}
          isLoading={data.recentDocuments.isLoading}
        />
      </div>
    </div>
  );
}
