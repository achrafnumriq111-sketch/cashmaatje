import { useLocation } from "react-router-dom";

export default function Placeholder() {
  const { pathname } = useLocation();
  const title = pathname
    .split("/")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" › ");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title || "Pagina"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Deze pagina wordt binnenkort gebouwd.</p>
    </div>
  );
}
