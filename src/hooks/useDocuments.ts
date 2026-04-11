import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { toast } from "sonner";

export function useDocuments() {
  const { membership } = useOrganization();
  const orgId = membership?.organizationId;
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const documentsQuery = useQuery({
    queryKey: ["documents", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const missingDocsQuery = useQuery({
    queryKey: ["missing-documents", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_transactions")
        .select("id, transaction_date, description, counterparty_name, amount, status")
        .eq("organization_id", orgId!)
        .lt("amount", -100)
        .is("journal_entry_id", null)
        .order("transaction_date", { ascending: false });
      if (error) throw error;
      // Filter transactions that don't have a linked document
      const txIds = data.map((t) => t.id);
      if (txIds.length === 0) return [];
      const { data: docs } = await supabase
        .from("documents")
        .select("bank_transaction_id")
        .eq("organization_id", orgId!)
        .in("bank_transaction_id", txIds);
      const linkedIds = new Set((docs || []).map((d) => d.bank_transaction_id));
      return data.filter((t) => !linkedIds.has(t.id));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!orgId) throw new Error("Geen organisatie geselecteerd");

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = `${orgId}/${year}/${month}/${safeName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      // Determine document type
      const docType = file.type === "application/pdf" ? "invoice" as const : "receipt" as const;

      // Create document record
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          organization_id: orgId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          document_type: docType,
          ocr_status: "pending",
        })
        .select()
        .single();
      if (docError) throw docError;

      // Trigger OCR processing — edge function creates its own signed URL
      supabase.functions
        .invoke("process-invoice-ocr", {
          body: {
            document_id: doc.id,
            file_path: filePath,
            organization_id: orgId,
          },
        })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["documents", orgId] });
        })
        .catch((err) => {
          console.error("OCR trigger failed:", err);
          toast.error("OCR-verwerking mislukt");
        });

      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", orgId] });
      toast.success("Document geüpload");
    },
    onError: (err: Error) => {
      toast.error(`Upload mislukt: ${err.message}`);
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Record<string, unknown>;
    }) => {
      const { error } = await supabase
        .from("documents")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", orgId] });
      toast.success("Document bijgewerkt");
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", orgId] });
      toast.success("Document verwijderd");
    },
    onError: (err: Error) => {
      toast.error(`Verwijderen mislukt: ${err.message}`);
    },
  });

  const handleDrop = useCallback(
    (files: File[]) => {
      const allowed = ["image/jpeg", "image/png", "application/pdf"];
      files.forEach((f) => {
        if (allowed.includes(f.type)) {
          uploadMutation.mutate(f);
        } else {
          toast.error(`Ongeldig bestandstype: ${f.name}`);
        }
      });
    },
    [uploadMutation]
  );

  return {
    documents: documentsQuery.data ?? [],
    missingDocs: missingDocsQuery.data ?? [],
    isLoading: documentsQuery.isLoading,
    viewMode,
    setViewMode,
    uploadMutation,
    updateDocument,
    deleteDocument,
    handleDrop,
    orgId,
  };
}
