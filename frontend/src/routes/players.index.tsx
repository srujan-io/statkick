import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { playersQuery } from "@/lib/api";
import { ErrorBox, Loading, PosBadge } from "@/components/ui-bits";

const POSITIONS = ["All", "AT", "MT", "DF", "GB", "MT,AT", "MT,DF"];

export const Route = createFileRoute("/players/")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Players — StatKick" },
      { name: "description", content: "Search Big 5 Europe players by name, nation and position." },
      { property: "og:title", content: "Players — StatKick" },
      { property: "og:description", content: "Search Big 5 Europe players by name, nation and position." },
    ],
  }),
  component: Players,
});

function Players() {
  const { q: initial } = Route.useSearch();
  const navigate = useNavigate();
  const { data, isError, error, refetch } = useQuery(playersQuery());
  const [q, setQ] = useState(initial ?? "");
  const [pos, setPos] = useState("All");
  const [limit, setLimit] = useState(100);
  useEffect(() => setQ(initial ?? ""), [initial]);

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.players
    .map((player, index) => ({ player, index }))
    .filter(
      ({ player: p }) =>
        (pos === "All" || p.Position === pos) &&
        (!needle || p.Player.toLowerCase().includes(needle) || (p.Nation ?? "").toLowerCase().includes(needle)),
    );
  }, [data, q, pos]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setLimit(100); }}
          placeholder="Filter by player or nation…"
          className="w-72 border border-input bg-panel px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="flex border border-border">
          {POSITIONS.map((p) => (
            <button key={p} onClick={() => { setPos(p); setLimit(100); }} className={`num px-3 py-2 text-xs ${pos === p ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
              {p}
            </button>
          ))}
        </div>
        {data && <span className="num ml-auto text-xs text-muted-foreground">{rows.length.toLocaleString()} / {data.count.toLocaleString()} players</span>}
      </div>

      {isError ? (
        <ErrorBox error={error} onRetry={() => refetch()} />
      ) : !data ? (
        <Loading label="Loading players" />
      ) : rows.length === 0 ? (
        <div className="panel p-10 text-center text-sm text-muted-foreground">No players match your search.</div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="eyebrow text-left">
                <th className="px-4 py-3 font-normal">Player</th>
                <th className="px-4 py-3 font-normal">Nation</th>
                <th className="px-4 py-3 font-normal">Position</th>
                <th className="px-4 py-3 text-right font-normal">Age</th>
                <th className="px-4 py-3 text-right font-normal">Minutes</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map(({ player: p, index }) => (
                <tr key={index} onClick={() => navigate({ to: "/players/$name", params: { name: p.Player } })} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent">
                  <td className="px-4 py-2.5 font-medium">{p.Player}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.Nation}</td>
                  <td className="px-4 py-2.5"><PosBadge pos={p.Position} /></td>
                  <td className="num px-4 py-2.5 text-right">{p.Age}</td>
                  <td className="num px-4 py-2.5 text-right">{Number(p.Minutes).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > limit && (
            <button onClick={() => setLimit((l) => l + 200)} className="w-full border-t border-border py-3 text-xs text-primary hover:bg-accent">
              Show more ({rows.length - limit} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
