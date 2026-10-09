import { queryOptions } from "@tanstack/react-query";

export const DEFAULT_API =
  ((import.meta.env["VITE_API_URL"] as string | undefined)?.trim() || "http://127.0.0.1:8000").replace(/\/+$/, "");
const KEY = "statkick_api_base";

export function getApiBase(): string {
  if (typeof window === "undefined") return DEFAULT_API;
  return window.localStorage.getItem(KEY) || DEFAULT_API;
}
export function setApiBase(url: string) {
  window.localStorage.setItem(KEY, url.replace(/\/+$/, ""));
}

export class ApiError extends Error {
  constructor(public kind: "unavailable" | "notfound" | "server", msg: string) {
    super(msg);
  }
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`);
  } catch {
    throw new ApiError("unavailable", "We couldn't reach the StatKick backend.");
  }
  if (res.status === 404) throw new ApiError("notfound", "Not found.");
  if (!res.ok) throw new ApiError("server", "The backend returned an error.");
  return res.json() as Promise<T>;
}

export function friendlyError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.kind === "unavailable") return "The StatKick backend is unreachable. Make sure the FastAPI server is running.";
    if (e.kind === "notfound") return "We couldn't find that player.";
  }
  return "Something went wrong while loading data. Please try again.";
}

export interface PlayerRow { Player: string; Nation: string; Position: string; Age: number; Minutes: number }
export interface PlayerDetail {
  player: string; nation: string; position: string; age: number; minutes: number;
  statistics: Record<string, number>;
  pca: Record<string, number>;
}
export interface SimilarResponse {
  player: string; components_used: number; variance_captured: number;
  similar_players: { player: string; position: string; nation: string; distance: number }[];
}
export interface PcaPoint { player: string; position: string; nation: string; [pc: string]: number | string }
export interface PcaResponse { count: number; variance: Record<string, number>; players: PcaPoint[] }
export interface StatsResponse {
  players: number; features: number; pca_components: number; visualization_components: number;
  similarity_components: number; visualization_variance: number; similarity_variance: number; features_used: string[];
}

const enc = encodeURIComponent;
const forever = { staleTime: Infinity, gcTime: Infinity, retry: 1 } as const;

export const healthQuery = () =>
  queryOptions({ queryKey: ["health", getApiBase()], queryFn: () => get<{ status: string }>("/health"), refetchInterval: 30000, retry: 0 });
export const statsQuery = () => queryOptions({ queryKey: ["stats", getApiBase()], queryFn: () => get<StatsResponse>("/stats"), ...forever });
export const playersQuery = () =>
  queryOptions({ queryKey: ["players", getApiBase()], queryFn: () => get<{ count: number; players: PlayerRow[] }>("/players"), ...forever });
export const pcaQuery = () => queryOptions({ queryKey: ["pca", getApiBase()], queryFn: () => get<PcaResponse>("/pca"), ...forever });
export const playerQuery = (name: string) =>
  queryOptions({ queryKey: ["player", getApiBase(), name], queryFn: () => get<PlayerDetail>(`/players/${enc(name)}`), ...forever, retry: 0 });
export const similarQuery = (name: string, limit = 5) =>
  queryOptions({
    queryKey: ["similar", getApiBase(), name, limit],
    queryFn: () => get<SimilarResponse>(`/players/${enc(name)}/similar?limit=${limit}`),
    ...forever,
    retry: 0,
  });

export const PCS = ["PC1", "PC2", "PC3", "PC4", "PC5", "PC6", "PC7"];

export function shortStat(name: string) {
  return name.replace(" Per 90", " / 90").replace("Progressive", "Prog.");
}

export function posColor(pos: string): string {
  const p = ((pos || "").split(",")[0] ?? "").trim();
  return (
    { AT: "var(--pos-at)", MT: "var(--pos-mt)", DF: "var(--pos-df)", GB: "var(--pos-gb)" } as Record<string, string>
  )[p] ?? "var(--pos-other)";
}

/** Euclidean distance between two players' first k PCA coordinates, as returned by the backend. */
export function pcaDistance(a: Record<string, number>, b: Record<string, number>, k = 5) {
  return Math.sqrt(PCS.slice(0, k).reduce((s, pc) => s + (Number(a[pc]) - Number(b[pc])) ** 2, 0));
}
