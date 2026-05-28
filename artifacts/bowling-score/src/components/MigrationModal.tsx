import { useState, useEffect } from "react";
import { Database, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const LS_MEMBERS_KEY = "bowling_members";
const LS_RECORDS_KEY = "bowling_records";
const MIGRATION_DONE_KEY = "bowling_migration_done";

interface LegacyMember {
  id: string;
  name: string;
}

interface LegacyRecord {
  id: string;
  date: string;
  memberId: string;
  scores: (number | null)[];
}

function readLegacyData(): { members: LegacyMember[]; records: LegacyRecord[] } | null {
  try {
    const membersRaw = localStorage.getItem(LS_MEMBERS_KEY);
    const recordsRaw = localStorage.getItem(LS_RECORDS_KEY);
    if (!membersRaw && !recordsRaw) return null;
    const members: LegacyMember[] = membersRaw ? JSON.parse(membersRaw) : [];
    const records: LegacyRecord[] = recordsRaw ? JSON.parse(recordsRaw) : [];
    if (members.length === 0 && records.length === 0) return null;
    return { members, records };
  } catch {
    return null;
  }
}

type Status = "idle" | "migrating" | "done" | "error";

export default function MigrationModal() {
  const { refetch } = useApp() as ReturnType<typeof useApp> & { refetch?: () => void };
  const [open, setOpen] = useState(false);
  const [legacy, setLegacy] = useState<{ members: LegacyMember[]; records: LegacyRecord[] } | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (localStorage.getItem(MIGRATION_DONE_KEY)) return;
    const data = readLegacyData();
    if (data) {
      setLegacy(data);
      setOpen(true);
    }
  }, []);

  const handleMigrate = async () => {
    if (!legacy) return;
    setStatus("migrating");
    setErrorMsg("");

    try {
      if (legacy.members.length > 0) {
        const { error: memberError } = await supabase
          .from("members")
          .upsert(
            legacy.members.map((m) => ({ id: m.id, name: m.name })),
            { onConflict: "id", ignoreDuplicates: true }
          );
        if (memberError) throw memberError;
      }

      if (legacy.records.length > 0) {
        const { error: recordError } = await supabase
          .from("game_records")
          .upsert(
            legacy.records.map((r) => ({
              id: r.id,
              date: r.date,
              member_id: r.memberId,
              scores: r.scores,
            })),
            { onConflict: "id", ignoreDuplicates: true }
          );
        if (recordError) throw recordError;
      }

      localStorage.removeItem(LS_MEMBERS_KEY);
      localStorage.removeItem(LS_RECORDS_KEY);
      localStorage.setItem(MIGRATION_DONE_KEY, "true");
      setStatus("done");

      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const handleSkip = () => {
    localStorage.setItem(MIGRATION_DONE_KEY, "true");
    setOpen(false);
  };

  if (!legacy) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm rounded-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-500" />
            <DialogTitle>이전 데이터 발견</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {status === "idle" && (
            <>
              <p className="text-sm text-foreground">
                이 기기에 저장된 로컬 데이터를 Supabase로 이전하면 모든 팀원과 데이터를 공유할 수 있습니다.
              </p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">회원</span>
                  <span className="font-semibold">{legacy.members.length}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">점수 기록</span>
                  <span className="font-semibold">{legacy.records.length}건</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                이전 후 로컬 데이터는 삭제됩니다. 이미 Supabase에 같은 ID의 데이터가 있으면 건너뜁니다.
              </p>
            </>
          )}

          {status === "migrating" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              <p className="text-sm text-muted-foreground">이전 중...</p>
            </div>
          )}

          {status === "done" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <p className="text-sm font-medium text-green-600">이전 완료! 페이지를 새로고침합니다.</p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-sm">이전 중 오류가 발생했습니다.</p>
              </div>
              <p className="text-xs text-muted-foreground bg-gray-50 rounded-lg px-3 py-2 break-all">{errorMsg}</p>
            </div>
          )}
        </div>

        {(status === "idle" || status === "error") && (
          <DialogFooter>
            <Button variant="outline" onClick={handleSkip} className="text-sm">
              건너뛰기
            </Button>
            <Button
              onClick={handleMigrate}
              className="bg-teal-500 hover:bg-teal-600 text-white gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              Supabase로 이전
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
