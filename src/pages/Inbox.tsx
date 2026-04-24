import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, MessageSquare, Send, Loader2, Plus, X, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useBroadcasts, useSupportThreads, useSupportMessages } from "@/hooks/useMessaging";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const kindStyles: Record<string, string> = {
  info: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-yellow-500/10 text-yellow-200 border-yellow-500/20",
  success: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
  announcement: "bg-purple-500/10 text-purple-200 border-purple-500/20",
};

export default function Inbox() {
  const { broadcasts, markRead, isLoading: broadcastsLoading } = useBroadcasts();
  const { threads, createThread, isLoading: threadsLoading } = useSupportThreads(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Berichten van Cashmaatje en jouw ondersteuningsverzoeken
          </p>
        </div>
        <Button onClick={() => setComposeOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nieuw bericht
        </Button>
      </div>

      <Tabs defaultValue="broadcasts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="broadcasts" className="gap-2">
            <Megaphone className="h-3.5 w-3.5" /> Aankondigingen
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-2">
            <MessageSquare className="h-3.5 w-3.5" /> Support ({threads.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="broadcasts" className="space-y-3">
          {broadcastsLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {!broadcastsLoading && broadcasts.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Geen aankondigingen
              </CardContent>
            </Card>
          )}
          {broadcasts.map((b) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Card
                className={cn(
                  "transition-all hover:border-primary/30 cursor-pointer",
                  !b.read && "border-primary/30 bg-primary/[0.02]"
                )}
                onClick={() => !b.read && markRead.mutate({ id: b.id })}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[10px]", kindStyles[b.kind])}>
                        {b.kind}
                      </Badge>
                      {!b.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(b.created_at), { addSuffix: true, locale: nl })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">{b.title}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{b.body}</p>
                  {b.cta_url && b.cta_label && (
                    <a
                      href={b.cta_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline"
                    >
                      {b.cta_label} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="support" className="grid md:grid-cols-[280px_1fr] gap-4">
          <div className="space-y-2">
            {threadsLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {!threadsLoading && threads.length === 0 && (
              <Card>
                <CardContent className="p-4 text-xs text-center text-muted-foreground">
                  Geen support gesprekken
                </CardContent>
              </Card>
            )}
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  activeThreadId === t.id
                    ? "bg-primary/10 border-primary/30"
                    : "border-border hover:border-primary/20 bg-card"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground truncate">{t.subject}</span>
                  {t.unread_for_user && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <Badge variant="outline" className="text-[9px]">{t.status}</Badge>
                  <span>{formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true, locale: nl })}</span>
                </div>
              </button>
            ))}
          </div>
          <div>
            {activeThreadId ? (
              <ThreadView threadId={activeThreadId} />
            ) : (
              <Card className="h-full">
                <CardContent className="p-8 h-full flex items-center justify-center text-sm text-muted-foreground">
                  Selecteer een gesprek of start een nieuw bericht
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ComposeDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSubmit={async (subject, body) => {
          try {
            const t = await createThread.mutateAsync({ subject, body });
            setActiveThreadId(t.id);
            setComposeOpen(false);
            toast.success("Bericht verstuurd");
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
      />
    </div>
  );
}

function ThreadView({ threadId }: { threadId: string }) {
  const { user } = useAuth();
  const { messages, sendMessage, isLoading } = useSupportMessages(threadId);
  const [text, setText] = useState("");

  return (
    <Card className="h-[60vh] flex flex-col">
      <CardContent className="flex-1 overflow-auto p-5 space-y-3">
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  mine
                    ? "bg-primary text-primary-foreground"
                    : m.sender_is_admin
                    ? "bg-purple-500/15 text-foreground border border-purple-500/20"
                    : "bg-secondary text-foreground"
                )}
              >
                {m.sender_is_admin && !mine && (
                  <div className="text-[10px] font-semibold mb-1 opacity-70">Cashmaatje team</div>
                )}
                <p className="whitespace-pre-wrap">{m.body}</p>
                <div className="text-[10px] opacity-60 mt-1">
                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: nl })}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Typ een bericht..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && text.trim()) {
              e.preventDefault();
              sendMessage.mutate(text);
              setText("");
            }
          }}
        />
        <Button
          size="icon"
          disabled={!text.trim() || sendMessage.isPending}
          onClick={() => {
            sendMessage.mutate(text);
            setText("");
          }}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function ComposeDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (subject: string, body: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuw support bericht</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Onderwerp" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea
            placeholder="Beschrijf je vraag..."
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button
            disabled={!subject.trim() || !body.trim()}
            onClick={() => {
              onSubmit(subject, body);
              setSubject("");
              setBody("");
            }}
          >
            Verstuur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
