import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { Info, RotateCcw } from "lucide-react";
import { pcaQuery, posColor, type PcaPoint } from "@/lib/api";
import { ErrorBox, Loading } from "@/components/ui-bits";

const GROUPS = ["All", "AT", "MT", "DF", "GB"];

export const Route = createFileRoute("/pca")({
  head: () => ({
    meta: [
      { title: "PCA Map — StatKick" },
      { name: "description", content: "Interactive PC1 vs PC2 scatter plot of every player's playing style." },
      { property: "og:title", content: "PCA Map — StatKick" },
      { property: "og:description", content: "Interactive PC1 vs PC2 scatter plot of every player's playing style." },
    ],
  }),
  component: PcaMap,
});

function Tip({ active, payload }: { active?: boolean; payload?: { payload: PcaPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload;
  return (
    <div className="panel px-3 py-2 text-xs shadow-xl">
      <div className="font-medium">{p.player}</div>
      <div className="num text-muted-foreground">{p.position}</div>
      <div className="num mt-1">PC1 {Number(p["PC1"]).toFixed(2)} · PC2 {Number(p["PC2"]).toFixed(2)}</div>
    </div>
  );
}

function PcaMap() {
  const { data, isError, error, refetch } = useQuery(pcaQuery());
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");

  const { base, hits } = useMemo(() => {
    if (!data) return { base: [], hits: [] };
    const filtered = data.players.filter((p) => group === "All" || p.position.split(",").map((s) => s.trim()).includes(group));
    const n = q.trim().toLowerCase();
    return { base: filtered, hits: n ? filtered.filter((p) => p.player.toLowerCase().includes(n)) : [] };
  }, [data, q, group]);

  const byColor = useMemo(() => {
    const m = new Map<string, PcaPoint[]>();
    for (const p of base) {
      const c = posColor(p.position);
      m.set(c, [...(m.get(c) ?? []), p]);
    }
    return [...m.entries()];
  }, [base]);

  const v = data?.variance;
  const open = (p: PcaPoint) => navigate({ to: "/players/$name", params: { name: p.player } });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Highlight a player…" className="w-64 border border-input bg-panel px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="flex border border-border">
            {GROUPS.map((g) => (
              <button key={g} onClick={() => setGroup(g)} className={`num flex items-center gap-1.5 px-3 py-2 text-xs ${group === g ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent"}`}>
                {g !== "All" && <span className="h-2 w-2 rounded-full" style={{ background: posColor(g) }} />}
                {g}
              </button>
            ))}
          </div>
          <button onClick={() => { setQ(""); setGroup("All"); }} className="flex items-center gap-1.5 border border-border px-3 py-2 text-xs hover:bg-accent">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          {data && <span className="num ml-auto text-xs text-muted-foreground">{base.length.toLocaleString()} points{hits.length ? ` · ${hits.length} highlighted` : ""}</span>}
        </div>
        <div className="panel h-[640px] p-3">
          {isError ? (
            <ErrorBox error={error} onRetry={() => refetch()} />
          ) : !data ? (
            <Loading label="Loading PCA coordinates" />
          ) : data.players.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No PCA coordinates are available.</div>
          ) : base.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No players match the selected position.</div>
          ) : (
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid stroke="var(--border)" />
                <XAxis type="number" dataKey="PC1" name="PC1" stroke="var(--muted-foreground)" fontSize={11} label={{ value: `PC1 (${v?.["PC1"]}%)`, position: "insideBottom", offset: -10, fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis type="number" dataKey="PC2" name="PC2" stroke="var(--muted-foreground)" fontSize={11} label={{ value: `PC2 (${v?.["PC2"]}%)`, angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 11 }} />
                <ZAxis range={[14, 14]} />
                <Tooltip content={<Tip />} cursor={{ stroke: "var(--border)" }} />
                {byColor.map(([c, pts]) => (
                  <Scatter key={c} data={pts} fill={c} fillOpacity={hits.length ? 0.12 : 0.6} isAnimationActive={false} onClick={(e) => open(e.payload as PcaPoint)} className="cursor-pointer" />
                ))}
                {hits.length > 0 && (
                  <Scatter data={hits} fill="var(--foreground)" stroke="var(--primary)" strokeWidth={2} isAnimationActive={false} onClick={(e) => open(e.payload as PcaPoint)} shape="circle" />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <aside className="space-y-3">
        <div className="panel p-4">
          <div className="eyebrow">Variance shown</div>
          <div className="num mt-1 text-3xl text-primary">{v ? (Number(v["PC1"]) + Number(v["PC2"])).toFixed(2) : "—"}%</div>
          <div className="num mt-2 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>PC1</span><span>{v?.["PC1"] ?? "—"}%</span></div>
            <div className="flex justify-between"><span>PC2</span><span>{v?.["PC2"] ?? "—"}%</span></div>
          </div>
        </div>
        <div className="panel space-y-2 p-4 text-sm">
          <div className="flex items-center gap-2 font-display font-semibold"><Info className="h-4 w-4 text-primary" /> What am I looking at?</div>
          <p className="text-muted-foreground">Every point is a player. The seven-dimensional feature space is projected onto its first two principal directions — the axes of greatest variance.</p>
          <p className="text-muted-foreground">This 2-D view is for orientation only. Similarity is computed in the first five components, so players that look close here may differ along PC3–PC5.</p>
          <p className="text-muted-foreground">Coordinates describe attacking and progression style, not player quality.</p>
        </div>
        {hits.length > 0 && (
          <div className="panel max-h-64 overflow-auto p-2">
            {hits.slice(0, 30).map((h) => (
              <button key={h.player} onClick={() => open(h)} className="block w-full px-2 py-1.5 text-left text-xs hover:bg-accent">{h.player} <span className="num text-muted-foreground">{h.position}</span></button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
