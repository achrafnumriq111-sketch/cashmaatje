import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { pageTransition, cardVariant } from "@/lib/animations";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="flex min-h-screen items-center justify-center bg-background">
      <motion.div variants={cardVariant} className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oeps! Pagina niet gevonden</p>
        <a href="/" className="text-primary underline hover:text-primary/90">Terug naar home</a>
      </motion.div>
    </motion.div>
  );
};

export default NotFound;
