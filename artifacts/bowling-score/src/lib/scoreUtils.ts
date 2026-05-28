export function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "";
  return score >= 200 ? "text-red-500 font-bold" : "";
}

export function formatBirthdateDisplay(bd: string | null | undefined): string | null {
  if (!bd || !bd.trim()) return null;
  try {
    const d = new Date(bd + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch { return null; }
}

export function calcAvg(scores: (number | null)[]): number | null {
  const nums = scores.filter((s): s is number => s !== null);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}
