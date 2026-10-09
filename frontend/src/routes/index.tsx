import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { pcaQuery, playersQuery, statsQuery } from "@/lib/api";
import { ErrorBox, Loading, Metric, Section } from "@/components/ui-bits";
import { VarianceChart } from "@/components/VarianceChart";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StatKick — Football, represented mathematically" },
      { name: "description", content: "Explore football playing styles through vector spaces, PCA and statistical similarity." },
      { property: "og:title", content: "StatKick — Football, represented mathematically" },
      { property: "og:description", content: "Explore football playing styles through vector spaces, PCA and statistical similarity." },
    ],
  }),
  component: Overview,
});

const STEPS = [
  ["Football Data", "Big 5 Europe, 2024/25 per-90 stats"],
  ["Player Vectors", "Each player → a vector in ℝ⁷"],
  ["Linear Algebra", "Rank, orthogonalization, projection"],
  ["PCA", "Eigen-decomposition of covariance"],
  ["Player Similarity", "Euclidean distance in PC1–PC5"],
];

function Overview() {
  const stats = useQuery(statsQuery());
  const pca = useQuery(pcaQuery());
  const players = useQuery(playersQuery());
  const s = stats.data;
  const highMinutesPlayers = useMemo(
    () => players.data?.players.slice().sort((a, b) => b.Minutes - a.Minutes).slice(0, 4) ?? [],
    [players.data],
  );
  return (
    <>
      <div className="grid-bg relative -mx-8 -mt-8 border-b border-border px-8 py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />
        <div className="relative max-w-3xl">
          <div className="eyebrow mb-4 text-primary">StatKick · Principal Component Analysis</div>
          <h2 className="font-display text-5xl font-black leading-[1.02] tracking-tight">Football, represented mathematically.</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">Explore player playing styles through vector spaces, PCA, and statistical similarity.</p>
          <div className="mt-6 flex gap-3">
            <Link to="/players" className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Explore players <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/pca" className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm hover:bg-accent">Open PCA map</Link>
          </div>
        </div>
      </div>

      {stats.isError ? (
        <ErrorBox error={stats.error} onRetry={() => stats.refetch()} />
      ) : !s ? (
        <Loading label="Loading dataset summary" />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric value={s.players.toLocaleString()} label="Players" />
          <Metric value={s.features} label="Features" />
          <Metric value={s.pca_components} label="Principal components" />
          <Metric value={`${s.similarity_variance}%`} label="Variance captured" accent />
        </div>
      )}

      <Section title="Explained variance by component" eyebrow="Eigen-spectrum">
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <div className="panel p-5">
            {pca.isError ? <ErrorBox error={pca.error} /> : pca.data ? <VarianceChart variance={pca.data.variance} /> : <Loading label="Loading PCA" />}
          </div>
          <div className="grid gap-3">
            <div className="panel p-5">
              <div className="eyebrow">{s?.visualization_components ?? 2} PCs</div>
              <div className="num mt-1 text-3xl text-primary">{s ? `${s.visualization_variance}%` : "—"}</div>
              <p className="mt-2 text-xs text-muted-foreground">Used for the 2-D PCA map.</p>
            </div>
            <div className="panel p-5">
              <div className="eyebrow">{s?.similarity_components ?? 5} PCs</div>
              <div className="num mt-1 text-3xl text-pos-mt">{s ? `${s.similarity_variance}%` : "—"}</div>
              <p className="mt-2 text-xs text-muted-foreground">Used for player similarity.</p>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Players with the most minutes"
        eyebrow={players.data ? `${players.data.count.toLocaleString()} players in the dataset` : "Dataset players"}
        right={<Link to="/players" className="text-xs text-primary hover:underline">Browse all players</Link>}
      >
        {players.isError ? (
          <ErrorBox error={players.error} onRetry={() => players.refetch()} />
        ) : !players.data ? (
          <Loading label="Loading players" />
        ) : highMinutesPlayers.length === 0 ? (
          <div className="panel p-6 text-sm text-muted-foreground">No players are available in the dataset.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {highMinutesPlayers.map((player) => (
              <Link
                key={`${player.Player}-${player.Nation}`}
                to="/players/$name"
                params={{ name: player.Player }}
                className="panel p-4 hover:bg-accent"
              >
                <div className="font-display font-semibold">{player.Player}</div>
                <div className="mt-1 text-xs text-muted-foreground">{player.Nation} · {player.Position}</div>
                <div className="num mt-3 text-sm">{Number(player.Minutes).toLocaleString()} minutes</div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="How StatKick works" eyebrow="Pipeline">
        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-5">
          {STEPS.map(([t, d], i) => (
            <div key={t} className="relative bg-panel p-5">
              <div className="num text-xs text-primary">0{i + 1}</div>
              <div className="mt-6 font-display font-semibold">{t}</div>
              <div className="mt-1 text-xs text-muted-foreground">{d}</div>
              {i < STEPS.length - 1 && <ArrowRight className="absolute right-3 top-5 hidden h-4 w-4 text-muted-foreground md:block" />}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          StatKick describes attacking and progression-based playing-style similarity — not an all-around evaluation of player quality.
        </p>
      </Section>
    </>
  );
}
