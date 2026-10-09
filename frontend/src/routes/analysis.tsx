import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PCS, pcaQuery, statsQuery } from "@/lib/api";
import { ErrorBox, Loading, Section } from "@/components/ui-bits";
import { VarianceChart } from "@/components/VarianceChart";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "The mathematics — StatKick" },
      { name: "description", content: "Feature space, standardization, eigenvalues and principal directions behind StatKick." },
      { property: "og:title", content: "The mathematics — StatKick" },
      { property: "og:description", content: "Feature space, standardization, eigenvalues and principal directions behind StatKick." },
    ],
  }),
  component: Analysis,
});

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 border-t border-border pt-8 md:grid-cols-[180px_1fr]">
      <div><div className="num text-xs text-primary">{n}</div><h2 className="mt-1 font-display text-lg font-semibold">{title}</h2></div>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

function Analysis() {
  const stats = useQuery(statsQuery());
  const pca = useQuery(pcaQuery());
  const eigenvalues = stats.data && pca.data
    ? PCS.filter((pc) => pca.data.variance[pc] !== undefined).map((pc) => ({
        pc,
        value: (Number(pca.data.variance[pc]) * stats.data.features) / 100,
      }))
    : [];
  const max = Math.max(...eigenvalues.map(({ value }) => value), 1);
  return (
    <div className="space-y-10">
      <Section title="From statistics to geometry" eyebrow="Analysis">
        <p className="max-w-2xl text-sm text-muted-foreground">StatKick models attacking and progression-based playing style. The Python pipeline performs every computation; this page explains its results.</p>
      </Section>
      <Block n="01" title="Feature space">
        <p>Each player is represented as a vector <span className="num text-foreground">x ∈ ℝ<sup>{stats.data?.features ?? "…"}</sup></span> using performance features, all normalized per 90 minutes.</p>
        {stats.isError ? <ErrorBox error={stats.error} /> : !stats.data ? <Loading /> : (
          <ol className="grid gap-px border border-border bg-border sm:grid-cols-2">
            {stats.data.features_used.map((f, i) => (
              <li key={f} className="flex gap-3 bg-panel px-4 py-2.5 text-foreground"><span className="num text-muted-foreground">x{i + 1}</span>{f}</li>
            ))}
          </ol>
        )}
      </Block>
      <Block n="02" title="Standardization">
        <p>Features live on very different scales — progressive receives per 90 can be ten times larger than goals per 90. Without rescaling, PCA would be dominated by whichever feature has the largest raw variance.</p>
        <p>Each feature is therefore standardized: <span className="num text-foreground">z = (x − μ) / σ</span>. Every column then has mean 0 and variance 1, and PCA works on the correlation structure rather than the units.</p>
      </Block>
      <Block n="03" title="Eigenvalues">
        <p>The approximate eigenvalues of the standardized covariance matrix measure variance along each principal direction. They are derived from the API's rounded explained-variance percentages and feature count, and sum to roughly the number of standardized features.</p>
        {stats.isError ? <ErrorBox error={stats.error} onRetry={() => stats.refetch()} /> :
          pca.isError ? <ErrorBox error={pca.error} onRetry={() => pca.refetch()} /> :
          !stats.data || !pca.data ? <Loading label="Loading eigenvalues" /> : (
            <div className="panel divide-y divide-border">
              {eigenvalues.map(({ pc, value }) => (
                <div key={pc} className="flex items-center gap-4 px-4 py-2.5">
                  <span className="num w-10 text-foreground">λ{pc.slice(2)}</span>
                  <div className="h-1.5 flex-1 bg-muted"><div className="h-full bg-primary" style={{ width: `${(value / max) * 100}%` }} /></div>
                  <span className="num w-20 text-right text-foreground">{value.toFixed(3)}</span>
                </div>
              ))}
            </div>
          )}
      </Block>
      <Block n="04" title="Explained variance">
        <p>Dividing each eigenvalue by their total gives the share of variance each component explains.</p>
        <div className="panel p-5">{pca.isError ? <ErrorBox error={pca.error} /> : pca.data ? <VarianceChart variance={pca.data.variance} /> : <Loading />}</div>
      </Block>
      <Block n="05" title="Principal directions">
        <p>The eigenvectors of the covariance matrix are orthonormal and define the principal directions — the axes along which player data varies most. Diagonalizing the covariance matrix (<span className="num text-foreground">C = PDPᵀ</span>) rotates the feature space onto these axes.</p>
        <p>A player's PCA coordinates are the projections of their standardized vector onto these directions. They describe style, not quality, and are not ratings.</p>
      </Block>
    </div>
  );
}
