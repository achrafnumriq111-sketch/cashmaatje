import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AuthLogo } from "@/components/AuthLogo";
import { motion } from "framer-motion";
import { pageTransition, cardVariant } from "@/lib/animations";

export default function Index() {
  const { user, signOut } = useAuth();

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="dark min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <AuthLogo />
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </header>
      <main className="flex flex-col items-center justify-center px-6 py-24">
        <motion.div variants={cardVariant} className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welkom bij CashMaatje</h2>
          <p className="mt-2 text-muted-foreground">Your financial management dashboard is ready.</p>
        </motion.div>
      </main>
    </motion.div>
  );
}
