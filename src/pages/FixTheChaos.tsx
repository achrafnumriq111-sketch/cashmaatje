import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Sparkles, Inbox, Euro, Flame } from "lucide-react";
import { useChaosData } from "@/hooks/useChaosData";
import { ChaosUploadZone } from "@/components/chaos/ChaosUploadZone";
import {
  ChaosItemCard,
  ChaosItemSkeleton,
  AnalyzingPlaceholder,
} from "@/components/chaos/ChaosItemCard";
import { UploadStatusList } from "@/components/chaos/UploadStatusList";
import { PanicScoreGauge } from "@/components/chaos/PanicScoreGauge";
import { DailyAnchorCard } from "@/components/chaos/DailyAnchorCard";
import { UrgencyLanes } from "@/components/chaos/UrgencyLanes";
import { SevenDayPlanCard } from "@/components/chaos/SevenDayPlanCard";
import { BookkeeperHandoverButton } from "@/components/chaos/BookkeeperHandoverButton";
import { NeverAgainPanel } from "@/components/chaos/NeverAgainPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import {
  ChaosFilters,
  applyChaosFilters,
  defaultChaosFilters,
  type ChaosFilterState,
} from "@/components/chaos/ChaosFilters";

export default function FixTheChaos() {
  const {
    items,
    uploads,
    uploadFiles,
    resolveItem,
    reopenItem,
    deleteUpload,
    retryUpload,
    stats,
    lanes,
    dailyAnchor,
  } = useChaosData();
  const [view, setView] = useState<"lanes" | "list">("lanes");
  const [filters, setFilters] = useState<ChaosFilterState>(defaultChaosFilters);

  const list = items.data ?? [];
  const open = useMemo(() => list.filter((i) => !i.is_resolved), [list]);
  const resolved = useMemo(() => list.filter((i) => i.is_resolved), [list]);
  const filteredOpen = useMemo(() => applyChaosFilters(open, filters), [open, filters]);
  const filteredResolved = useMemo(
    () => applyChaosFilters(resolved, filters),
    [resolved, filters]
  );
  const filteredLanes = useMemo(
    () => ({
      today: filteredOpen.filter((i) => i.urgency_lane === "today"),
      this_week: filteredOpen.filter((i) => i.urgency_lane === "this_week"),
      later: filteredOpen.filter((i) => i.urgency_lane === "later" || !i.urgency_lane),
    }),
    [filteredOpen]
  );
  const allUploads = uploads.data ?? [];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-[1400px]"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/20 flex items-center justify-center">
          <Flame className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            FIX THE CHAOS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Je business-reddingssysteem. Geen administratie — actie. Gooi alles erin
            waar je niets mee kunt en wij vertellen je precies wat je wanneer moet doen.
          </p>
        </div>
      </motion.div>

      {/* Panic gauge + Daily Anchor */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PanicScoreGauge score={stats.topPanic} openCount={stats.open} />
        <div className="lg:col-span-2">
          <DailyAnchorCard item={dailyAnchor} onOpen={() => { /* sheet opens via card click below */ }} />
        </div>
      </motion.div>

      {/* Stat band */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Urgent" value={stats.red} tone="red" />
        <StatCard icon={<Sparkles className="w-4 h-4" />} label="Belangrijk" value={stats.orange} tone="orange" />
        <StatCard icon={<Inbox className="w-4 h-4" />} label="Open totaal" value={stats.open} tone="muted" />
        <StatCard
          icon={<Euro className="w-4 h-4" />}
          label="Te betalen"
          value={`€${stats.totalDue.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`}
          tone="muted"
        />
      </motion.div>

      {/* Upload */}
      <motion.div variants={fadeInUp}>
        <ChaosUploadZone
          onFiles={(files) => uploadFiles.mutate(files)}
          isUploading={uploadFiles.isPending}
        />
      </motion.div>

      {stats.analyzing > 0 && <AnalyzingPlaceholder count={stats.analyzing} />}

      {/* Per-document live status with retry */}
      {allUploads.length > 0 && (
        <motion.div variants={fadeInUp}>
          <UploadStatusList
            uploads={allUploads}
            isLoading={uploads.isLoading}
            retryingId={
              retryUpload.isPending ? (retryUpload.variables as string) : null
            }
            onRetry={(id) => retryUpload.mutate(id)}
            onDelete={(u) => deleteUpload.mutate(u)}
          />
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <ChaosFilters
          value={filters}
          onChange={setFilters}
          totalCount={open.length}
          filteredCount={filteredOpen.length}
        />
      </motion.div>

      {/* Lists with view toggle */}
      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="open" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="open">
                Open ({filteredOpen.length}
                {filteredOpen.length !== open.length ? ` van ${open.length}` : ""})
              </TabsTrigger>
              <TabsTrigger value="done">
                Afgehandeld ({filteredResolved.length}
                {filteredResolved.length !== resolved.length ? ` van ${resolved.length}` : ""})
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-1 rounded-lg border p-0.5">
              <Button
                variant={view === "lanes" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setView("lanes")}
              >
                Banen
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setView("list")}
              >
                Lijst
              </Button>
            </div>
          </div>

          <TabsContent value="open" className="space-y-3 mt-0">
            {items.isLoading ? (
              <>
                <ChaosItemSkeleton />
                <ChaosItemSkeleton />
              </>
            ) : open.length === 0 ? (
              <EmptyState
                title={list.length === 0 ? "Nog niets geüpload" : "Alles afgehandeld"}
                hint={
                  list.length === 0
                    ? "Begin met het uploaden van die stapel brieven."
                    : "Goed bezig. Je hebt geen openstaande acties meer."
                }
              />
            ) : filteredOpen.length === 0 ? (
              <EmptyState
                title="Geen items voor deze filters"
                hint="Pas de filters aan of wis ze om alles te tonen."
              />
            ) : view === "lanes" ? (
              <UrgencyLanes
                lanes={filteredLanes}
                onResolve={(id) => resolveItem.mutate(id)}
              />
            ) : (
              filteredOpen.map((item) => (
                <ChaosItemCard
                  key={item.id}
                  item={item}
                  onResolve={(id) => resolveItem.mutate(id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="done" className="space-y-3 mt-0">
            {resolved.length === 0 ? (
              <EmptyState title="Nog niets afgehandeld" hint="Vink items af zodra je ze hebt geregeld." />
            ) : filteredResolved.length === 0 ? (
              <EmptyState
                title="Geen afgehandelde items voor deze filters"
                hint="Pas de filters aan of wis ze om alles te tonen."
              />
            ) : (
              filteredResolved.map((item) => (
                <ChaosItemCard
                  key={item.id}
                  item={item}
                  onResolve={(id) => resolveItem.mutate(id)}
                  onReopen={(id) => reopenItem.mutate(id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </motion.div>


      {/* Recovery plan */}
      <motion.div variants={fadeInUp}>
        <SevenDayPlanCard />
      </motion.div>

      {/* Bookkeeper handover */}
      <motion.div variants={fadeInUp}>
        <BookkeeperHandoverButton />
      </motion.div>

      {/* Never again */}
      <motion.div variants={fadeInUp}>
        <NeverAgainPanel />
      </motion.div>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: "red" | "orange" | "muted";
}) {
  const toneClass =
    tone === "red"
      ? "text-red-500"
      : tone === "orange"
      ? "text-amber-500"
      : "text-muted-foreground";
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wide ${toneClass}`}>
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/30 py-14 text-center">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
