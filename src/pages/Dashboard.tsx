import { useDashboardData } from "@/hooks/useDashboardData";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { ActionItems } from "@/components/dashboard/ActionItems";

export default function Dashboard() {
  const data = useDashboardData();
  const latest = data.healthSnapshot.data?.[0];
  const previous = data.healthSnapshot.data?.[1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.role === "entrepreneur" ? "Overzicht van je bedrijf" : "Financieel overzicht"}
        </p>
      </div>

      <KpiCards latest={latest} previous={previous} role={data.role} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RevenueChart data={data.monthlyRevenue.data} isLoading={data.monthlyRevenue.isLoading} />
        </div>
        <div className="lg:col-span-2">
          <HealthScore snapshot={latest} isLoading={data.healthSnapshot.isLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions
          transactions={data.recentTransactions.data ?? []}
          isLoading={data.recentTransactions.isLoading}
          role={data.role}
        />
        <ActionItems
          unreconciledCount={data.unreconciledCount.data ?? 0}
          missingDocsCount={data.missingDocsCount.data ?? 0}
          anomaliesCount={data.anomaliesCount.data ?? 0}
          vatDeadline={data.vatDeadline.data}
          role={data.role}
        />
      </div>
    </div>
  );
}
