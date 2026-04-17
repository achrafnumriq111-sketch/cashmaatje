import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Boxes, Plus, ScanLine, Search, Pencil, Trash2, AlertTriangle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pageTransition, cardVariant } from "@/lib/animations";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useProducts, type Product } from "@/hooks/useProducts";
import { ProductDialog } from "@/components/inventory/ProductDialog";
import { BarcodeScannerDialog } from "@/components/inventory/BarcodeScannerDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Inventory() {
  const { products, isLoading, deleteProduct } = useProducts();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? "").includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + p.current_stock * p.purchase_price, 0);
    const lowStock = products.filter((p) => p.min_stock > 0 && p.current_stock <= p.min_stock).length;
    return { count: products.length, totalValue, lowStock };
  }, [products]);

  const formatEUR = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-7xl">
      <motion.div variants={cardVariant} className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              Voorraad
              <InfoTooltip content="Beheer je producten, voorraadtellingen en mobiel scannen. Saldo wordt automatisch bijgewerkt door verkopen en inkopen." />
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{stats.count} producten · waarde {formatEUR(stats.totalValue)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setScannerOpen(true)} className="gap-2">
            <ScanLine className="h-4 w-4" /> Scannen
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Nieuw product
          </Button>
        </div>
      </motion.div>

      <motion.div variants={cardVariant} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="arcory-glass">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Producten</p>
            <p className="text-2xl font-semibold mt-1">{stats.count}</p>
          </CardContent>
        </Card>
        <Card className="arcory-glass">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Voorraadwaarde (inkoop)</p>
            <p className="text-2xl font-semibold mt-1">{formatEUR(stats.totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="arcory-glass">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-amber-500" /> Lage voorraad
            </p>
            <p className="text-2xl font-semibold mt-1">{stats.lowStock}</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Productcatalogus
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Zoek op naam, SKU, barcode…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {isLoading ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">Laden…</p>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-12 text-center space-y-2">
                <Package className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <p className="text-sm font-medium text-foreground">Nog geen producten</p>
                <p className="text-xs text-muted-foreground">Voeg je eerste product toe om te starten</p>
                <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }} className="mt-2">
                  <Plus className="h-4 w-4 mr-1.5" /> Product toevoegen
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Naam</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead className="text-right">Voorraad</TableHead>
                    <TableHead className="text-right">Verkoop</TableHead>
                    <TableHead className="text-right">BTW</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const low = p.min_stock > 0 && p.current_stock <= p.min_stock;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.category ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <span className={low ? "text-amber-500 font-medium" : ""}>
                            {Number(p.current_stock).toLocaleString("nl-NL")} {p.unit}
                          </span>
                          {low && <Badge variant="outline" className="ml-2 text-[10px] border-amber-500/40 text-amber-500">Laag</Badge>}
                        </TableCell>
                        <TableCell className="text-right">{formatEUR(p.sales_price)}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">{p.vat_percentage}%</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(p); setDialogOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setConfirmDelete(p)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <ProductDialog open={dialogOpen} onClose={() => setDialogOpen(false)} product={editing} />
      <BarcodeScannerDialog open={scannerOpen} onClose={() => setScannerOpen(false)} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Product verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.name}" en alle voorraadbewegingen worden permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) deleteProduct.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
