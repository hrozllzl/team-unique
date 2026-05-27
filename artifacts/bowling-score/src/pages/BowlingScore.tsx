import { useState, useCallback } from "react";
import { Trash2, RotateCcw, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_GAMES = 4;
const MAX_SCORE = 300;

interface Player {
  id: number;
  name: string;
  scores: (number | "")[];
}

function getValidScore(val: string): number | "" {
  if (val === "") return "";
  const n = Number(val);
  if (isNaN(n) || n < 0 || n > MAX_SCORE) return "";
  return n;
}

function calcAverage(scores: (number | "")[]): number | null {
  const filled = scores.filter((s): s is number => s !== "");
  if (filled.length === 0) return null;
  return Math.round((filled.reduce((a, b) => a + b, 0) / filled.length) * 10) / 10;
}

function getRankBadge(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}위`;
}

function getScoreColor(score: number | "") {
  if (score === "") return "text-muted-foreground";
  if (score >= 250) return "text-yellow-600 font-bold";
  if (score >= 200) return "text-blue-600 font-semibold";
  if (score >= 150) return "text-green-600";
  if (score >= 100) return "text-foreground";
  return "text-destructive";
}

export default function BowlingScore() {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: "플레이어 1", scores: ["", "", "", ""] },
  ]);
  const [newPlayerName, setNewPlayerName] = useState("");

  const addPlayer = useCallback(() => {
    const name = newPlayerName.trim() || `플레이어 ${players.length + 1}`;
    setPlayers((prev) => [
      ...prev,
      { id: Date.now(), name, scores: ["", "", "", ""] },
    ]);
    setNewPlayerName("");
  }, [newPlayerName, players.length]);

  const removePlayer = useCallback((id: number) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateName = useCallback((id: number, name: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  }, []);

  const updateScore = useCallback((id: number, gameIdx: number, val: string) => {
    const score = getValidScore(val);
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              scores: p.scores.map((s, i) => (i === gameIdx ? score : s)),
            }
          : p
      )
    );
  }, []);

  const resetAll = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, scores: ["", "", "", "", ""] }))
    );
  }, []);

  const playersWithAvg = players
    .map((p) => ({ ...p, avg: calcAverage(p.scores) }))
    .sort((a, b) => {
      if (a.avg === null && b.avg === null) return 0;
      if (a.avg === null) return 1;
      if (b.avg === null) return -1;
      return b.avg - a.avg;
    });

  const hasAnyScore = players.some((p) =>
    p.scores.some((s) => s !== "")
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">볼링 점수 기록기</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            1게임~4게임까지 점수를 입력하면 평균을 자동으로 계산합니다
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">플레이어 추가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                data-testid="input-new-player"
                placeholder="이름 입력 (선택사항)"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                className="flex-1"
              />
              <Button data-testid="button-add-player" onClick={addPlayer}>
                추가
              </Button>
            </div>
          </CardContent>
        </Card>

        {players.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">점수 입력</CardTitle>
                <Button
                  data-testid="button-reset-all"
                  variant="ghost"
                  size="sm"
                  onClick={resetAll}
                  disabled={!hasAnyScore}
                  className="text-muted-foreground hover:text-destructive gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  초기화
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-32 min-w-[120px]">
                        이름
                      </th>
                      {Array.from({ length: MAX_GAMES }, (_, i) => (
                        <th
                          key={i}
                          className="text-center py-2 px-2 font-medium text-muted-foreground w-20 min-w-[72px]"
                        >
                          {i + 1}G
                        </th>
                      ))}
                      <th className="text-center py-2 pl-4 font-medium text-muted-foreground w-20 min-w-[72px]">
                        평균
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => {
                      const avg = calcAverage(player.scores);
                      return (
                        <tr
                          key={player.id}
                          data-testid={`row-player-${player.id}`}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2 pr-4">
                            <Input
                              data-testid={`input-name-${player.id}`}
                              value={player.name}
                              onChange={(e) => updateName(player.id, e.target.value)}
                              className="h-8 text-sm font-medium border-transparent hover:border-border focus:border-primary"
                            />
                          </td>
                          {player.scores.map((score, idx) => (
                            <td key={idx} className="py-2 px-2 text-center">
                              <Input
                                data-testid={`input-score-${player.id}-game${idx + 1}`}
                                type="number"
                                min={0}
                                max={MAX_SCORE}
                                value={score}
                                onChange={(e) =>
                                  updateScore(player.id, idx, e.target.value)
                                }
                                className={`h-8 text-center text-sm w-full ${getScoreColor(score)}`}
                                placeholder="-"
                              />
                            </td>
                          ))}
                          <td
                            className="py-2 pl-4 text-center font-semibold"
                            data-testid={`text-avg-${player.id}`}
                          >
                            {avg !== null ? (
                              <span
                                className={
                                  avg >= 200
                                    ? "text-blue-600"
                                    : avg >= 150
                                    ? "text-green-600"
                                    : "text-foreground"
                                }
                              >
                                {avg}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-2">
                            <Button
                              data-testid={`button-remove-${player.id}`}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removePlayer(player.id)}
                              disabled={players.length === 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {hasAnyScore && playersWithAvg.some((p) => p.avg !== null) && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <CardTitle className="text-base font-medium">순위</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {playersWithAvg
                  .filter((p) => p.avg !== null)
                  .map((player, idx) => {
                    const filledCount = player.scores.filter(
                      (s) => s !== ""
                    ).length;
                    const total = player.scores
                      .filter((s): s is number => s !== "")
                      .reduce((a, b) => a + b, 0);
                    return (
                      <div
                        key={player.id}
                        data-testid={`rank-row-${player.id}`}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          idx === 0 ? "bg-yellow-50 border border-yellow-200" : "bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg w-8 text-center">
                            {getRankBadge(idx + 1)}
                          </span>
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {player.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {filledCount}게임 입력 · 합계 {total}점
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              player.avg! >= 200
                                ? "text-blue-600"
                                : player.avg! >= 150
                                ? "text-green-600"
                                : "text-foreground"
                            }`}
                          >
                            {player.avg}
                          </p>
                          <p className="text-xs text-muted-foreground">평균</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground pb-4">
          점수 범위: 0 ~ 300점 · 입력한 게임 수 기준으로 평균 계산
        </div>
      </div>
    </div>
  );
}
