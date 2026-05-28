import { useState, useEffect } from "react";
import { Database, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
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

const SCHEMA_SQL = `-- 1. members 테이블에 phone, birthdate 컬럼 추가
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE members ADD COLUMN IF NOT EXISTS birthdate text DEFAULT '';

-- 2. user_accounts 테이블 생성
CREATE TABLE IF NOT EXISTS user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  birthdate text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved')),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. RLS 설정
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_accounts' AND policyname = 'allow_all_user_accounts'
  ) THEN
    CREATE POLICY "allow_all_user_accounts"
      ON user_accounts FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE user_accounts;`;

interface LegacyMember { id: string; name: string; }
interface LegacyRecord { id: string; date: string; memberId: string; scores: (number | null)[]; }

function readLegacyData(): { members: LegacyMember[]; records: LegacyRecord[] } | null {
  try {
    const membersRaw = localStorage.getItem(LS_MEMBERS_KEY);
    const recordsRaw = localStorage.getItem(LS_RECORDS_KEY);
    if (!membersRaw && !recordsRaw) return null;
    const members: LegacyMember[] = membersRaw ? JSON.parse(membersRaw) : [];
    const records: LegacyRecord[] = recordsRaw ? JSON.parse(recordsRaw) : [];
    if (members.length === 0 && records.length === 0) return null;
    return { members, records };
  } catch { return null; }
}

type Mode = "legacy" | "schema";
type Status = "idle" | "migrating" | "done" | "error";

export default function MigrationModal() {
  const { role } = useAuth();
  const { refetch } = useApp() as ReturnType<typeof useApp> & { refetch?: () => void };
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("legacy");
  const [legacy, setLegacy] = useState<{ members: LegacyMember[]; records: LegacyRecord[] } | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check localStorage migration first
    if (!localStorage.getItem(MIGRATION_DONE_KEY)) {
      const data = readLegacyData();
      if (data) { setLegacy(data); setMode("legacy"); setOpen(true); return; }
    }
    // Check schema migration (admin only)
    if (role !== "admin") return;
    (async () => {
      const { error } = await supabase.from("user_accounts").select("id").limit(1);
      if (error && error.code === "42P01") {
        setMode("schema");
        setOpen(true);
      }
    })();
  }, [role]);

  const handleMigrate = async () => {
    if (!legacy) return;
    setStatus("migrating");
    setErrorMsg("");
    try {
      if (legacy.members.length > 0) {
        const { error } = await supabase.from("members")
          .upsert(legacy.members.map((m) => ({ id: m.id, name: m.name })),
            { onConflict: "id", ignoreDuplicates: true });
        if (error) throw error;
      }
      if (legacy.records.length > 0) {
        const { error } = await supabase.from("game_records")
          .upsert(legacy.records.map((r) => ({ id: r.id, date: r.date, member_id: r.memberId, scores: r.scores })),
            { onConflict: "id", ignoreDuplicates: true });
        if (error) throw error;
      }
      localStorage.removeItem(LS_MEMBERS_KEY);
      localStorage.removeItem(LS_RECORDS_KEY);
      localStorage.setItem(MIGRATION_DONE_KEY, "true");
      setStatus("done");
      setTimeout(() => { setOpen(false); window.location.reload(); }, 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  const handleSkip = () => {
    localStorage.setItem(MIGRATION_DONE_KEY, "true");
    setOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSchemaDone = () => {
    setOpen(false);
    window.location.reload();
  };

  if (!open) return null;

  // Schema migration modal
  if (mode === "schema") {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg rounded-2xl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-500" />
              <DialogTitle>DB 스키마 업데이트 필요</DialogTitle>
            </div>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <p className="text-sm text-muted-foreground">
              회원가입/승인 기능을 사용하려면 Supabase SQL Editor에서 아래 SQL을 실행해 주세요.
            </p>
            <pre className="text-xs bg-gray-50 border border-border rounded-xl p-4 overflow-x-auto whitespace-pre-wrap max-h-64">
              {SCHEMA_SQL}
            </pre>
          </div>
          <DialogFooter>
            <Button onClick={handleCopy} variant="outline" className="rounded-xl">
              {copied ? "✓ 복사됨" : "SQL 복사"}
            </Button>
            <Button onClick={handleSchemaDone} className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl gap-1.5">
              <CheckCircle className="w-4 h-4" />
              실행 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Legacy data migration modal
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
              <p className="text-sm text-foreground">이 기기에 저장된 로컬 데이터를 Supabase로 이전하면 모든 팀원과 데이터를 공유할 수 있습니다.</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">회원</span>
                  <span className="font-semibold">{legacy?.members.length}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">점수 기록</span>
                  <span className="font-semibold">{legacy?.records.length}건</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">이전 후 로컬 데이터는 삭제됩니다. 이미 같은 ID의 데이터가 있으면 건너뜁니다.</p>
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
            <Button variant="outline" onClick={handleSkip} className="text-sm">건너뛰기</Button>
            <Button onClick={handleMigrate} className="bg-teal-500 hover:bg-teal-600 text-white gap-1.5">
              <ArrowRight className="w-4 h-4" />
              Supabase로 이전
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
