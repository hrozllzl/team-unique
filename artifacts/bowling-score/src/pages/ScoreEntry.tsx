import { useState } from "react";
import { ClipboardEdit } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const GAME_COUNT = 4;

export default function ScoreEntry() {
  const { members, addRecord } = useApp();
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [selectedId, setSelectedId] = useState<string>("");
  const [scores, setScores] = useState<string[]>(Array(GAME_COUNT).fill(""));

  const handleScoreChange = (idx: number, val: string) => {
    setScores((prev) => prev.map((s, i) => (i === idx ? val : s)));
  };

  const handleSubmit = () => {
    if (!selectedId) {
      toast({ title: "회원을 선택해 주세요.", variant: "destructive" });
      return;
    }
    const parsed = scores.map((s) => {
      const n = parseInt(s, 10);
      if (s === "" || isNaN(n) || n < 0 || n > 300) return null;
      return n;
    });
    const hasAny = parsed.some((v) => v !== null);
    if (!hasAny) {
      toast({ title: "1게임 이상 점수를 입력해 주세요.", variant: "destructive" });
      return;
    }
    addRecord({ date, memberId: selectedId, scores: parsed });
    setScores(Array(GAME_COUNT).fill(""));
    setSelectedId("");
    toast({ title: "점수가 저장되었습니다!" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <ClipboardEdit className="w-6 h-6 text-teal-500" />
        <h1 className="text-2xl font-bold text-foreground">점수 입력</h1>
      </div>

      <div className="border-b border-border mb-6" />

      <div className="bg-white border border-border rounded-2xl shadow-sm p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">날짜</label>
          <Input
            data-testid="input-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">회원 선택</label>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              회원 관리에서 먼저 회원을 추가해 주세요.
            </p>
          ) : (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger data-testid="select-member" className="rounded-xl">
                <SelectValue placeholder="회원을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">게임별 점수</label>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: GAME_COUNT }, (_, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs text-center text-muted-foreground font-medium">
                  {i + 1}G
                </p>
                <Input
                  data-testid={`input-score-game${i + 1}`}
                  type="number"
                  min={0}
                  max={300}
                  placeholder="-"
                  value={scores[i]}
                  onChange={(e) => handleScoreChange(i, e.target.value)}
                  className="text-center rounded-xl"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">0 ~ 300점 · 비워두면 미입력으로 처리됩니다</p>
        </div>

        <Button
          data-testid="button-save-score"
          onClick={handleSubmit}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-xl"
          disabled={members.length === 0}
        >
          저장
        </Button>
      </div>
    </div>
  );
}
