import { useState } from "react";
import { Phone, Mail, MessageSquare, FileText, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useContactActivities, useLogContactActivity, type ActivityType } from "@/hooks/useContactActivities";

const ICONS: Record<ActivityType, React.ReactNode> = {
  call: <Phone className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  note: <FileText className="h-3.5 w-3.5" />,
  meeting: <Calendar className="h-3.5 w-3.5" />,
  sms: <MessageSquare className="h-3.5 w-3.5" />,
};

const LABELS: Record<ActivityType, string> = {
  call: "Telefoon", email: "E-mail", note: "Notitie", meeting: "Afspraak", sms: "SMS",
};

interface Props {
  contactId: string;
  email?: string | null;
  phone?: string | null;
}

export function ContactActivityLog({ contactId, email, phone }: Props) {
  const { data: activities = [], isLoading } = useContactActivities(contactId);
  const log = useLogContactActivity();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ActivityType>("note");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");

  const quickAction = async (action: ActivityType, openHref?: string) => {
    if (openHref) window.open(openHref, "_self");
    try {
      await log.mutateAsync({
        contactId,
        activityType: action,
        subject: action === "call" ? `Belactie naar ${phone}` : action === "email" ? `E-mail aan ${email}` : "Snelle actie",
      });
      toast.success(`${LABELS[action]} gelogd`);
    } catch { toast.error("Kon niet loggen"); }
  };

  const submit = async () => {
    try {
      await log.mutateAsync({ contactId, activityType: type, subject: subject || undefined, notes: notes || undefined });
      toast.success("Activiteit opgeslagen");
      setOpen(false); setSubject(""); setNotes(""); setType("note");
    } catch { toast.error("Opslaan mislukt"); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Communicatie</h3>
        <div className="flex gap-1.5">
          {phone && (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => quickAction("call", `tel:${phone}`)}>
              <Phone className="h-3 w-3" /> Bel
            </Button>
          )}
          {email && (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => quickAction("email", `mailto:${email}`)}>
              <Mail className="h-3 w-3" /> Mail
            </Button>
          )}
          <Button size="sm" variant="default" className="h-7 px-2 text-xs gap-1" onClick={() => setOpen(true)}>
            <Plus className="h-3 w-3" /> Notitie
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : activities.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Nog geen activiteiten gelogd.</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {activities.map((a) => (
            <li key={a.id} className="rounded-md bg-muted/20 p-2.5 text-xs">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-[10px] gap-1">{ICONS[a.activity_type]} {LABELS[a.activity_type]}</Badge>
                <span className="text-muted-foreground text-[10px]">
                  {new Date(a.performed_at).toLocaleString("nl-NL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {a.subject && <p className="font-medium">{a.subject}</p>}
              {a.notes && <p className="text-muted-foreground mt-0.5">{a.notes}</p>}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Activiteit loggen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["call","email","note","meeting","sms"] as ActivityType[]).map(t => (
                    <SelectItem key={t} value={t}>{LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Onderwerp</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Korte beschrijving" />
            </div>
            <div>
              <Label className="text-xs">Notities</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
            <Button onClick={submit} disabled={log.isPending}>{log.isPending ? "Opslaan..." : "Opslaan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
