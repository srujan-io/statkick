import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PCS, pcaDistance, playerQuery, playersQuery, shortStat } from "@/lib/api";
import { ErrorBox, Loading, Section, tooltipStyle } from "@/components/ui-bits";

export const Route = createFileRoute("/compare")({
  validateSearch: z.object({ a: z.string().optional(), b: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Compare players — StatKick" },
      { name: "description", content: "Compare two players' feature vectors and PCA style distance." },
      { property: "og:title", content: "Compare players — StatKick" },
      { property: "og:description", content: "Compare two players' feature vectors and PCA style distance." },
    ],
  }),
  component: Compare,
});

function Picker({ value, onChange, label }: { value?: string | undefined; onChange: (v: string) => void; label: string }) {
  return (
    <label className="block flex-1">
      <div className="eyebrow mb-1">{label}</div>
      <input
        list="players-list"
        defaultValue={value}
        key={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a player name…"
        className="w-full border border-input bg-panel px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Compare() {
  const { a, b } = Route.useSearch();
  const navigate = useNavigate({ from: "/compare" });
  const list = useQuery(playersQuery());
  const names = new Set(list.data?.players.map((p) => p.Player));
  const set = (k: "a" | "b") => (v: string) => { if (names.has(v)) navigate({ search: (s) => ({ ...s, [k]: v }) }); };
  const pa = useQuery({ ...playerQuery(a ?? ""), enabled: !!a });
  const pb = useQuery({ ...playerQuery(b ?? ""), enabled: !!b });

  const ready = pa.data && pb.data;
  const feats = ready ? Object.keys(pa.data!.statistics) : [];
  const radar = feats.map((f) => {
    const x = Number(pa.data!.statistics[f]), y = Number(pb.data!.statistics[f]);
    const m = Math.max(x, y) || 1;
    return { f: shortStat(f), A: x / m, B: y / m, ra: x, rb: y };
  });

  return (
    <>
      <datalist id="players-list">{list.data?.players.map((p) => <option key={p.Player + p.Nation} value={p.Player} />)}</datalist>
      <div className="flex flex-wrap items-end gap-4">
        <Picker label="Player A" value={a} onChange={set("a")} />
        <span className="num pb-2 text-muted-foreground">vs</span>
        <Picker label="Player B" value={b} onChange={set("b")} />
      </div>
      {list.isError && <ErrorBox error={list.error} onRetry={() => list.refetch()} />}
      {list.isLoading && !list.data && <Loading label="Loading available players" />}
      {(pa.isError || pb.isError) && (
        <ErrorBox
          error={pa.isError ? pa.error : pb.error}
          onRetry={() => (pa.isError ? pa.refetch() : pb.refetch())}
        />
      )}
      {list.data?.count === 0 ? (
        <div className="panel p-10 text-center text-sm text-muted-foreground">No players are available to compare.</div>
      ) : !a || !b ? (
        <div className="panel p-10 text-center text-sm text-muted-foreground">Select two players to compare their playing-style vectors.</div>
      ) : pa.isLoading || pb.isLoading ? (
        <Loading label="Loading players" />
      ) : ready ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            {[pa.data!, pb.data!].map((p, i) => (
              <Link key={p.player} to="/players/$name" params={{ name: p.player }} className="panel p-4 hover:bg-accent">
                <div className={`eyebrow ${i ? "text-pos-mt" : "text-primary"}`}>Player {i ? "B" : "A"}</div>
                <div className="mt-1 font-display text-xl font-semibold">{p.player}</div>
                <div className="num text-xs text-muted-foreground">{p.position} · {p.age} · {p.nation}</div>
              </Link>
            ))}
            <div className="panel p-4">
              <div className="eyebrow">PCA Style Distance</div>
              <div className="num mt-1 text-3xl text-primary">{pcaDistance(pa.data!.pca, pb.data!.pca).toFixed(4)}</div>
              <div className="text-xs text-muted-foreground">Euclidean, PC1–PC5. Lower = more similar style; not a quality measure.</div>
            </div>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <Section title="Feature profile" eyebrow="Normalized per feature to the larger value">
              <div className="panel h-96 p-3">
                <ResponsiveContainer>
                  <RadarChart data={radar} outerRadius="72%">
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="f" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                    <Radar name={pa.data!.player} dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} />
                    <Radar name={pb.data!.player} dataKey="B" stroke="var(--pos-mt)" fill="var(--pos-mt)" fillOpacity={0.25} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip {...tooltipStyle} formatter={(_v, n, item) => [Number(n === pa.data!.player ? item.payload.ra : item.payload.rb).toFixed(2), n]} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="Raw values & PCA scores" eyebrow="Per 90 · PC1–PC5">
              <div className="panel overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-border"><tr className="eyebrow text-left"><th className="px-4 py-2 font-normal">Metric</th><th className="px-4 py-2 text-right font-normal text-primary">A</th><th className="px-4 py-2 text-right font-normal text-pos-mt">B</th></tr></thead>
                  <tbody>
                    {feats.map((f) => (
                      <tr key={f} className="border-b border-border/60"><td className="px-4 py-1.5 text-muted-foreground">{shortStat(f)}</td><td className="num px-4 py-1.5 text-right">{Number(pa.data!.statistics[f]).toFixed(2)}</td><td className="num px-4 py-1.5 text-right">{Number(pb.data!.statistics[f]).toFixed(2)}</td></tr>
                    ))}
                    {PCS.slice(0, 5).map((pc) => (
                      <tr key={pc} className="border-b border-border/60 last:border-0"><td className="num px-4 py-1.5 text-muted-foreground">{pc}</td><td className="num px-4 py-1.5 text-right">{Number(pa.data!.pca[pc]).toFixed(3)}</td><td className="num px-4 py-1.5 text-right">{Number(pb.data!.pca[pc]).toFixed(3)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        </>
      ) : null}
    </>
  );
}
