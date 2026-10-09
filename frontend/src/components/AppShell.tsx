import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, GitCompare, LayoutGrid, ScatterChart, Search, Sigma, Settings2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { DEFAULT_API, getApiBase, healthQuery, setApiBase } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutGrid },
  { to: "/players", label: "Players", icon: BarChart3 },
  { to: "/pca", label: "PCA Map", icon: ScatterChart },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/analysis", label: "Analysis", icon: Sigma },
] as const;

const META: Record<string, [string, string]> = {
  "/": ["Overview", "Attacking and progression-based playing-style similarity"],
  "/players": ["Players", "Search and filter the full player database"],
  "/pca": ["PCA Map", "Two-dimensional projection of the player feature space"],
  "/compare": ["Compare", "Side-by-side feature vectors and PCA style distance"],
  "/analysis": ["Analysis", "The linear algebra behind StatKick"],
};

function Health() {
  const { isSuccess, isLoading } = useQuery(healthQuery());
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const qc = useQueryClient();
  useEffect(() => setUrl(getApiBase()), [open]);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 border border-border px-3 py-1.5 text-xs hover:bg-accent">
        <span className="eyebrow">Backend</span>
        <span className={`h-2 w-2 rounded-full ${isLoading ? "bg-muted-foreground" : isSuccess ? "bg-success" : "bg-destructive"}`} />
        <span>{isLoading ? "Checking" : isSuccess ? "Connected" : "Offline"}</span>
        <Settings2 className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setApiBase(url || DEFAULT_API);
            qc.invalidateQueries();
            setOpen(false);
            window.location.reload();
          }}
          className="panel absolute right-0 z-50 mt-2 w-80 space-y-2 p-3 shadow-xl"
        >
          <div className="eyebrow">API base URL</div>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="num w-full border border-input bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" />
          <p className="text-[11px] text-muted-foreground">Point this at your running FastAPI server (default {DEFAULT_API}).</p>
          <button className="w-full bg-primary py-1.5 text-xs font-medium text-primary-foreground">Save & reconnect</button>
        </form>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const key = path.startsWith("/players/") ? null : path;
  const [title, desc] = key ? META[key] ?? ["StatKick", ""] : ["Player Profile", "Performance vector, PCA coordinates and statistically similar players"];

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-border bg-panel">
        <div className="border-b border-border px-5 py-5">
          <div className="font-display text-lg font-black tracking-[0.18em]">
            STAT<span className="text-primary">KICK</span>
          </div>
          <div className="eyebrow mt-1 text-[0.6rem]">PCA · Player similarity</div>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              activeProps={{ className: "!border-primary bg-accent !text-foreground" }}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border px-5 py-4">
          <div className="num text-sm">2024/25</div>
          <div className="eyebrow">Big 5 Europe</div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-border bg-background/90 px-8 py-4 backdrop-blur">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">{desc}</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/players", search: { q } });
            }}
            className="flex w-64 items-center gap-2 border border-input bg-panel px-3 py-1.5"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a player…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </form>
          <Health />
        </header>
        <main className="mx-auto max-w-7xl space-y-10 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
