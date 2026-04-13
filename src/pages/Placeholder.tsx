import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { pageTransition, cardVariant } from "@/lib/animations";

export default function Placeholder() {
  const { pathname } = useLocation();
  const title = pathname.split("/").filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" › ");

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit">
      <motion.div variants={cardVariant}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title || "Pagina"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Deze pagina wordt binnenkort gebouwd.</p>
      </motion.div>
    </motion.div>
  );
}
