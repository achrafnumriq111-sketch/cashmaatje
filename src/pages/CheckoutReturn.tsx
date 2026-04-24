import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const navigate = useNavigate();
  const { isActive, tier, refetch } = useSubscription();

  useEffect(() => {
    // Webhook should populate within a few seconds
    const interval = setInterval(() => refetch(), 2000);
    const timeout = setTimeout(() => clearInterval(interval), 30000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [refetch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              {isActive ? (
                <CheckCircle2 className="h-8 w-8 text-primary" />
              ) : (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {isActive ? "Welkom bij Cashmaatje!" : "Betaling wordt verwerkt..."}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {isActive
                  ? `Je ${tier?.toUpperCase()} plan is actief. Je kunt direct aan de slag.`
                  : "Even geduld terwijl we je abonnement activeren."}
              </p>
            </div>
            {sessionId && (
              <p className="text-[10px] text-muted-foreground font-mono">Session: {sessionId.slice(0, 20)}...</p>
            )}
            <div className="flex gap-2">
              <Button onClick={() => navigate("/")} className="flex-1">
                Naar dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate("/inbox")} className="flex-1">
                Bekijk inbox
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
