import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";

const EU_COUNTRIES = [
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU",
  "IE","IT","LV","LT","LU","MT","PL","PT","RO","SK","SI","ES","SE",
];

const VAT_PREFIX_MAP: Record<string, string> = {
  AT: "ATU", BE: "BE", BG: "BG", HR: "HR", CY: "CY", CZ: "CZ",
  DK: "DK", EE: "EE", FI: "FI", FR: "FR", DE: "DE", GR: "EL",
  HU: "HU", IE: "IE", IT: "IT", LV: "LV", LT: "LT", LU: "LU",
  MT: "MT", PL: "PL", PT: "PT", RO: "RO", SK: "SK", SI: "SI",
  ES: "ES", SE: "SE",
};

export interface IcpLineData {
  vatNumber: string;
  contactName: string;
  contactId: string | null;
  country: string;
  goodsAmount: number;
  servicesAmount: number;
  totalAmount: number;
  transactionCount: number;
  warnings: string[];
  journalEntries: {
    id: string;
    date: string;
    description: string;
    amount: number;
    vatBox: string | null;
    invoiceId: string | null;
  }[];
}

export interface IcpSummary {
  totalAmount: number;
  totalGoods: number;
  totalServices: number;
  customerCount: number;
  transactionCount: number;
  warningCount: number;
}

function validateVatNumber(vatNumber: string, country: string): string[] {
  const warnings: string[] = [];
  if (!vatNumber) {
    warnings.push("BTW-nummer ontbreekt");
    return warnings;
  }
  const prefix = VAT_PREFIX_MAP[country];
  if (prefix && !vatNumber.toUpperCase().startsWith(prefix)) {
    warnings.push(`BTW-nummer begint niet met verwacht landprefix '${prefix}'`);
  }
  if (vatNumber.replace(/[^a-zA-Z0-9]/g, "").length < 8) {
    warnings.push("BTW-nummer lijkt te kort");
  }
  return warnings;
}

export function useIcpReport(year: number, quarter: number) {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const qc = useQueryClient();

  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  const periodStart = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const periodEndDate = new Date(year, endMonth, 0);
  const periodEnd = `${year}-${String(endMonth).padStart(2, "0")}-${String(periodEndDate.getDate()).padStart(2, "0")}`;

  const icpData = useQuery({
    queryKey: ["icp-data", orgId, year, quarter],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: lines, error } = await supabase
        .from("journal_lines")
        .select(`
          id,
          debit_amount,
          credit_amount,
          vat_amount,
          vat_rate_type,
          vat_box,
          contact_id,
          description,
          journal_entry_id,
          invoice_id,
          journal_entries!inner (
            id,
            date,
            description,
            status,
            organization_id
          )
        `)
        .eq("journal_entries.organization_id", orgId!)
        .eq("journal_entries.status", "posted")
        .gte("journal_entries.date", periodStart)
        .lte("journal_entries.date", periodEnd)
        .in("vat_rate_type", ["icp", "reverse_charge"])
        .in("vat_box", ["3b", "1e"]);

      if (error) throw error;

      const contactIds = [...new Set((lines || []).map(l => l.contact_id).filter(Boolean))] as string[];
      
      if (contactIds.length === 0) return { lines: [], contacts: {} };

      const { data: contacts, error: cErr } = await supabase
        .from("contacts")
        .select("id, name, btw_number, address_country, is_eu, is_customer")
        .in("id", contactIds);

      if (cErr) throw cErr;

      const contactMap: Record<string, typeof contacts[0]> = {};
      (contacts || []).forEach(c => { contactMap[c.id] = c; });

      return { lines: lines || [], contacts: contactMap };
    },
  });

  const processedLines: IcpLineData[] = (() => {
    if (!icpData.data) return [];
    const { lines, contacts } = icpData.data;

    const grouped: Record<string, {
      contactId: string | null;
      contactName: string;
      vatNumber: string;
      country: string;
      goods: number;
      services: number;
      count: number;
      entries: IcpLineData["journalEntries"];
    }> = {};

    for (const line of lines) {
      const contact = line.contact_id ? contacts[line.contact_id] : null;
      if (!contact) continue;

      const country = contact.address_country || "";
      if (country === "NL" || !EU_COUNTRIES.includes(country)) continue;
      if (!contact.btw_number) continue;

      const key = contact.btw_number.toUpperCase().replace(/\s/g, "");
      if (!grouped[key]) {
        grouped[key] = {
          contactId: contact.id,
          contactName: contact.name,
          vatNumber: contact.btw_number,
          country,
          goods: 0,
          services: 0,
          count: 0,
          entries: [],
        };
      }

      const je = line.journal_entries as any;
      const amount = Math.abs((line.credit_amount || 0) - (line.debit_amount || 0));
      
      if (line.vat_box === "3b") {
        grouped[key].services += amount;
      } else {
        grouped[key].goods += amount;
      }
      
      grouped[key].count += 1;
      grouped[key].entries.push({
        id: je.id,
        date: je.date,
        description: je.description || line.description || "",
        amount,
        vatBox: line.vat_box,
        invoiceId: line.invoice_id,
      });
    }

    return Object.values(grouped).map(g => {
      const warnings = validateVatNumber(g.vatNumber, g.country);
      
      return {
        vatNumber: g.vatNumber,
        contactName: g.contactName,
        contactId: g.contactId,
        country: g.country,
        goodsAmount: g.goods,
        servicesAmount: g.services,
        totalAmount: g.goods + g.services,
        transactionCount: g.count,
        warnings,
        journalEntries: g.entries,
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  })();

  const summary: IcpSummary = {
    totalAmount: processedLines.reduce((s, l) => s + l.totalAmount, 0),
    totalGoods: processedLines.reduce((s, l) => s + l.goodsAmount, 0),
    totalServices: processedLines.reduce((s, l) => s + l.servicesAmount, 0),
    customerCount: processedLines.length,
    transactionCount: processedLines.reduce((s, l) => s + l.transactionCount, 0),
    warningCount: processedLines.filter(l => l.warnings.length > 0).length,
  };

  const existingReport = useQuery({
    queryKey: ["icp-report", orgId, year, quarter],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("icp_reports")
        .select("*")
        .eq("organization_id", orgId!)
        .eq("year", year)
        .eq("period_number", quarter)
        .eq("period_type", "quarterly")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const saveReport = useMutation({
    mutationFn: async (status: string) => {
      const existing = existingReport.data;

      if (existing) {
        const { error } = await supabase
          .from("icp_reports")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
        return existing.id;
      } else {
        const { data, error } = await supabase
          .from("icp_reports")
          .insert({
            organization_id: orgId!,
            year,
            period_number: quarter,
            period_type: "quarterly" as any,
            status,
          })
          .select("id")
          .single();
        if (error) throw error;

        if (processedLines.length > 0) {
          const lineRows = processedLines.map(l => ({
            icp_report_id: data.id,
            contact_id: l.contactId,
            contact_vat_number: l.vatNumber,
            contact_name: l.contactName,
            contact_country: l.country,
            goods_amount: l.goodsAmount,
            services_amount: l.servicesAmount,
            total_amount: l.totalAmount,
          }));

          const { error: lErr } = await supabase
            .from("icp_report_lines")
            .insert(lineRows);
          if (lErr) throw lErr;
        }

        return data.id;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["icp-report", orgId, year, quarter] });
    },
  });

  const exportJson = () => {
    const payload = {
      year,
      period: `Q${quarter}`,
      period_start: periodStart,
      period_end: periodEnd,
      total_amount: summary.totalAmount,
      entries: processedLines.map(l => ({
        vat_number: l.vatNumber,
        country: l.country,
        company_name: l.contactName,
        type: l.goodsAmount > l.servicesAmount ? "goods" : "services",
        goods_amount: l.goodsAmount,
        services_amount: l.servicesAmount,
        total_amount: l.totalAmount,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `icp-opgave-${year}-Q${quarter}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const headers = ["BTW-nummer", "Bedrijfsnaam", "Land", "Leveringen", "Diensten", "Totaal"];
    const rows = processedLines.map(l => [
      l.vatNumber, l.contactName, l.country,
      l.goodsAmount.toFixed(2), l.servicesAmount.toFixed(2), l.totalAmount.toFixed(2),
    ]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `icp-opgave-${year}-Q${quarter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    lines: processedLines,
    summary,
    isLoading: icpData.isLoading,
    report: existingReport.data,
    reportLoading: existingReport.isLoading,
    saveReport,
    exportJson,
    exportCsv,
  };
}
