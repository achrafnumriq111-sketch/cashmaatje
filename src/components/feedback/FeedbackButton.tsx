import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FeedbackButton() {
  const { user } = useAuth();
  const { membership } = useOrganization();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const submit = async () => {
    if (!message.trim()) {
      toast.error("Schrijf eerst een bericht");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("app_feedback").insert({
      user_id: user.id,
      organization_id: membership?.organizationId ?? null,
      page_path: location.pathname,
      feedback_type: type,
      message: message.trim(),
      user_agent: navigator.userAgent,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Feedback verstuurd — bedankt!");
    setMessage("");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-7 right-24 z-40 hidden md:flex items-center gap-1.5 rounded-full border border-border bg-card/90 backdrop-blur px-3 py-2 text-foreground shadow-md transition-all hover:scale-105 hover:bg-card",
          open && "opacity-0 pointer-events-none"
        )}
        aria-label="Feedback geven"
        title="Feedback geven"
      >
        <MessageCircle className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Feedback</span>
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border p-3">
            <h3 className="text-sm font-semibold text-foreground">Stuur feedback</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Sluiten">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 p-3">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Algemeen</SelectItem>
                <SelectItem value="bug">Bug / fout</SelectItem>
                <SelectItem value="suggestion">Suggestie</SelectItem>
                <SelectItem value="ux">UX / design</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Wat vond je goed of slecht? Wat zou je veranderen?"
            />
            <p className="text-xs text-muted-foreground">Pagina: <code>{location.pathname}</code></p>
            <Button onClick={submit} disabled={submitting} className="w-full gap-2">
              <Send className="h-3.5 w-3.5" /> Versturen
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
