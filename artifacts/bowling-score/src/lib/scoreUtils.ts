export function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "";
  return score >= 200 ? "text-red-500 font-bold" : "";
}

export function formatBirthdateDisplay(bd: string | null | undefined): string | null {
  if (!bd || !bd.trim()) return null;
  const isLunar = bd.startsWith("음력");
  const datePart = bd.replace(/^(양력|음력)\s*/, "");
  try {
    const d = new Date(datePart + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    const formatted = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    return isLunar ? `음력 ${formatted}` : `양력 ${formatted}`;
  } catch { return null; }
}

export function calcAvg(scores: (number | null)[]): number | null {
  const nums = scores.filter((s): s is number => s !== null);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}
