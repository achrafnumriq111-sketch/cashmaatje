import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, type Product } from "@/hooks/useProducts";

interface Props {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

export function ProductDialog({ open, onClose, product }: Props) {
  const { createProduct, updateProduct } = useProducts();
  const isEdit = !!product;

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      sku: product?.sku ?? "",
      name: product?.name ?? "",
      description: product?.description ?? "",
      category: product?.category ?? "",
      unit: product?.unit ?? "stuks",
      sales_price: product?.sales_price ?? 0,
      purchase_price: product?.purchase_price ?? 0,
      vat_percentage: product?.vat_percentage ?? 21,
      current_stock: product?.current_stock ?? 0,
      min_stock: product?.min_stock ?? 0,
      barcode: product?.barcode ?? "",
    },
  });

  const onSubmit = async (data: any) => {
    const payload = {
      ...data,
      sales_price: Number(data.sales_price),
      purchase_price: Number(data.purchase_price),
      vat_percentage: Number(data.vat_percentage),
      current_stock: Number(data.current_stock),
      min_stock: Number(data.min_stock),
    };
    if (isEdit && product) {
      await updateProduct.mutateAsync({ id: product.id, ...payload });
    } else {
      await createProduct.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Product bewerken" : "Nieuw product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>SKU *</Label>
              <Input {...register("sku", { required: true })} placeholder="PROD-001" />
            </div>
            <div>
              <Label>Categorie</Label>
              <Input {...register("category")} placeholder="Bijv. Hardware" />
            </div>
          </div>
          <div>
            <Label>Naam *</Label>
            <Input {...register("name", { required: true })} />
          </div>
          <div>
            <Label>Omschrijving</Label>
            <Textarea {...register("description")} rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Verkoopprijs (excl. BTW)</Label>
              <Input type="number" step="0.01" {...register("sales_price")} />
            </div>
            <div>
              <Label>Inkoopprijs</Label>
              <Input type="number" step="0.01" {...register("purchase_price")} />
            </div>
            <div>
              <Label>BTW %</Label>
              <Select value={String(watch("vat_percentage"))} onValueChange={(v) => setValue("vat_percentage", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="21">21%</SelectItem>
                  <SelectItem value="9">9%</SelectItem>
                  <SelectItem value="0">0%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Eenheid</Label>
              <Input {...register("unit")} placeholder="stuks" />
            </div>
            <div>
              <Label>Huidige voorraad</Label>
              <Input type="number" step="0.001" {...register("current_stock")} disabled={isEdit} />
            </div>
            <div>
              <Label>Min. voorraad</Label>
              <Input type="number" step="0.001" {...register("min_stock")} />
            </div>
          </div>
          <div>
            <Label>Barcode</Label>
            <Input {...register("barcode")} placeholder="EAN/UPC" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuleren</Button>
            <Button type="submit">{isEdit ? "Opslaan" : "Aanmaken"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
