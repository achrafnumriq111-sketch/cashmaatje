import { useState, useCallback } from "react";
import { useOrganization } from "./useOrganization";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-insights`;

export type AnalysisType =
  | "cash-runway"
  | "revenue-forecast"
  | "expense-optimization"
  | "tax-strategy"
  | "health-assessment";

export function useFinancialInsights() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (analysisType: AnalysisType, additionalData?: Record<string, any>) => {
      if (!orgId) return;
      setResult("");
      setError(null);
      setIsLoading(true);

      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ analysisType, organizationId: orgId, data: additionalData }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Analyse mislukt" }));
          setError(err.error || "Analyse mislukt");
          setIsLoading(false);
          return;
        }

        if (!resp.body) throw new Error("No stream body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                accumulated += content;
                setResult(accumulated);
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Onbekende fout");
      } finally {
        setIsLoading(false);
      }
    },
    [orgId]
  );

  return { result, isLoading, error, analyze };
}
