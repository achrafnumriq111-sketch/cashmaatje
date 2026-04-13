import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

interface ExportButtonProps {
  onClick: () => void;
  label?: string;
  loading?: boolean;
}

export function ExportButton({ onClick, label = "Export Excel", loading }: ExportButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={loading} className="gap-1.5">
      <FileSpreadsheet className="h-4 w-4" />
      {label}
    </Button>
  );
}
