export function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "";
  return score >= 200 ? "text-red-500 font-bold" : "";
}
