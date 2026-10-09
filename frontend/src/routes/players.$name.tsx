import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, GitCompare } from "lucide-react";
import { ApiError, PCS, playerQuery, shortStat, similarQuery } from "@/lib/api";
import { ErrorBox, Loading, Metric, PosBadge, Section, tooltipStyle } from "@/components/ui-bits";

export const Route = createFileRoute("/players/$name")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.name} — StatKick profile` },
      { name: "description", content: `${params.name}: performance vector, PCA coordinates and statistically similar players.` },
      { property: "og:title", content: `${params.name} — StatKick profile` },
      { property: "og:description", content: `Performance vector, PCA coordinates and statistically similar players for ${params.name}.` },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { name } = Route.useParams();
  const p = useQuery(playerQuery(name));
  const sim = useQuery({ ...similarQuery(name), enabled: p.isSuccess });

  if (p.isError)
    return (
      <div className="space-y-4">
        <Link to="/players" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> All players</Link>
        {p.error instanceof ApiError && p.error.kind === "notfound" ? (
          <div className="panel p-10 text-center text-sm text-muted-foreground">No player named “{name}” was found.</div>
        ) : (
          <ErrorBox error={p.error} onRetry={() => p.refetch()} />
        )}
      </div>
    );
  if (!p.data) return <Loading label="Loading player" />;
  const d = p.data;
  const pcaData = PCS.filter((pc) => d.pca[pc] !== undefined).map((pc, i) => ({ pc, v: Number(d.pca[pc]), i }));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link to="/players" className="mb-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> All players</Link>
          <h2 className="font-display text-4xl font-black tracking-tight">{d.player}</h2>
          <div className="num mt-1 text-sm text-muted-foreground">{d.position} · {d.age} years</div>
        </div>
        <Link to="/compare" search={{ a: d.player }} className="inline-flex items-center gap-2 border border-border px-3 py-2 text-xs hover:bg-accent">
          <GitCompare className="h-3.5 w-3.5" /> Compare
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric value={<span className="font-sans text-xl">{d.nation}</span>} label="Nation" />
        <Metric value={<PosBadge pos={d.position} />} label="Position" />
        <Metric value={d.age} label="Age" />
        <Metric value={Number(d.minutes).toLocaleString()} label="Minutes" />
      </div>

      <Section title="Performance vector" eyebrow="x ∈ ℝ⁷ · per 90 minutes">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {Object.entries(d.statistics).map(([k, v]) => (
            <div key={k} className="panel p-4">
              <div className="num text-2xl font-semibold">{Number(v).toFixed(2)}</div>
              <div className="mt-1 text-[11px] leading-tight text-muted-foreground">{shortStat(k)}</div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="PCA coordinates" eyebrow="Projection onto principal directions">
          <div className="panel h-80 p-4">
            <ResponsiveContainer>
              <BarChart data={pcaData} layout="vertical" margin={{ left: -10, right: 20 }}>
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="pc" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} width={50} />
                <ReferenceLine x={0} stroke="var(--muted-foreground)" />
                <Tooltip {...tooltipStyle} cursor={{ fill: "var(--accent)" }} formatter={(v: number) => [v.toFixed(3), "Score"]} />
                <Bar dataKey="v" radius={2}>
                  {pcaData.map((e) => <Cell key={e.pc} fill={e.i < 5 ? "var(--primary)" : "var(--muted-foreground)"} fillOpacity={e.i < 5 ? 1 : 0.5} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground">PCA coordinates describe playing style, not ratings. Highlighted components (PC1–PC5) drive similarity.</p>
        </Section>

        <Section title="Similar players" eyebrow="Statistically similar">
          <div className="panel overflow-hidden">
            {sim.isError ? (
              <div className="p-4"><ErrorBox error={sim.error} onRetry={() => sim.refetch()} /></div>
            ) : !sim.data ? (
              <Loading label="Finding similar players" />
            ) : sim.data.similar_players.length === 0 ? (
              <div className="p-5 text-sm text-muted-foreground">No similar players were returned.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="eyebrow text-left">
                    <th className="px-4 py-2.5 font-normal">#</th>
                    <th className="px-4 py-2.5 font-normal">Player</th>
                    <th className="px-4 py-2.5 font-normal">Position</th>
                    <th className="px-4 py-2.5 text-right font-normal">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {sim.data.similar_players.map((s, i) => (
                    <tr key={s.player} className="border-b border-border/60 last:border-0 hover:bg-accent">
                      <td className="num px-4 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-2"><Link to="/players/$name" params={{ name: s.player }} className="font-medium hover:text-primary">{s.player}</Link></td>
                      <td className="px-4 py-2"><PosBadge pos={s.position} /></td>
                      <td className="num px-4 py-2 text-right">{s.distance.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Similarity is measured using Euclidean distance in the first {sim.data?.components_used ?? 5} PCA components, capturing {sim.data?.variance_captured ?? 88.85}% of total variance.
          </p>
        </Section>
      </div>
    </>
  );
}
