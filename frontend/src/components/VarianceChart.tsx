import { Bar, CartesianGrid, Cell, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { tooltipStyle } from "./ui-bits";

export function VarianceChart({ variance }: { variance: Record<string, number> }) {
  let cum = 0;
  const data = Object.entries(variance).map(([pc, v], i) => {
    cum += Number(v);
    return { pc, v: Number(v), cum: +cum.toFixed(2), i };
  });
  return (
    <div className="h-72">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="pc" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
          <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "var(--accent)" }} formatter={(v: number, n) => [`${v}%`, n === "v" ? "Explained" : "Cumulative"]} />
          <Bar dataKey="v" radius={[2, 2, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.pc} fill={d.i < 2 ? "var(--primary)" : d.i < 5 ? "var(--pos-mt)" : "var(--muted)"} />
            ))}
          </Bar>
          <Line dataKey="cum" stroke="var(--foreground)" strokeWidth={1.5} dot={{ r: 2.5 }} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-2 flex gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><i className="h-2 w-3 bg-primary" />Visualization (PC1–2)</span>
        <span className="flex items-center gap-2"><i className="h-2 w-3 bg-pos-mt" />Similarity (PC1–5)</span>
        <span className="flex items-center gap-2"><i className="h-px w-3 bg-foreground" />Cumulative</span>
      </div>
    </div>
  );
}
