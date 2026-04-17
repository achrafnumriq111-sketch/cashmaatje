import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { toast } from "sonner";

export interface Product {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string | null;
  sales_price: number;
  purchase_price: number;
  vat_percentage: number;
  current_stock: number;
  min_stock: number;
  barcode: string | null;
  image_url: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useProducts() {
  const { membership } = useOrganization();
  const activeOrgId = membership?.organizationId ?? null;
  const qc = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["products", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", activeOrgId!)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const createProduct = useMutation({
    mutationFn: async (input: Partial<Product> & { sku: string; name: string }) => {
      if (!activeOrgId) throw new Error("Geen actieve organisatie");
      const { data, error } = await supabase
        .from("products")
        .insert({ ...input, organization_id: activeOrgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product aangemaakt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product bijgewerkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product verwijderd");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const adjustStock = useMutation({
    mutationFn: async ({ productId, quantity, notes }: { productId: string; quantity: number; notes?: string }) => {
      if (!activeOrgId) throw new Error("Geen actieve organisatie");
      const { error } = await supabase.from("stock_movements").insert({
        organization_id: activeOrgId,
        product_id: productId,
        movement_type: "manual_correction",
        quantity,
        notes: notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      toast.success("Voorraad bijgewerkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    products: productsQuery.data ?? [],
    isLoading: productsQuery.isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
  };
}

export function useStockMovements(productId?: string) {
  const { membership } = useOrganization();
  const activeOrgId = membership?.organizationId ?? null;

  return useQuery({
    queryKey: ["stock_movements", activeOrgId, productId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      let q = supabase
        .from("stock_movements")
        .select("*, products(name, sku)")
        .eq("organization_id", activeOrgId!)
        .order("movement_date", { ascending: false })
        .limit(200);
      if (productId) q = q.eq("product_id", productId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}
