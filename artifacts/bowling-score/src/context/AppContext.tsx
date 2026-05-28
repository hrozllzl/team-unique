import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Member {
  id: string;
  name: string;
}

export interface GameRecord {
  id: string;
  date: string;
  memberId: string;
  scores: (number | null)[];
}

interface AppContextType {
  members: Member[];
  records: GameRecord[];
  loading: boolean;
  addMember: (name: string) => void;
  removeMember: (id: string) => void;
  addRecord: (record: Omit<GameRecord, "id">) => void;
  addRecords: (records: Omit<GameRecord, "id">[]) => void;
  updateRecord: (id: string, scores: (number | null)[]) => void;
  updateRecordsDate: (oldDate: string, newDate: string) => void;
  removeRecord: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapMember = (m: any): Member => ({ id: m.id, name: m.name });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRecord = (r: any): GameRecord => ({
  id: r.id,
  date: r.date,
  memberId: r.member_id,
  scores: r.scores as (number | null)[],
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refetchAll = useCallback(async () => {
    const [mr, rr] = await Promise.all([
      supabase.from("members").select("*"),
      supabase.from("game_records").select("*").order("created_at", { ascending: true }),
    ]);
    if (mr.data) setMembers(mr.data.map(mapMember));
    if (rr.data) setRecords(rr.data.map(mapRecord));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refetchAll();
      setLoading(false);
    })();

    const channel = supabase
      .channel("bowling-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, () => {
        refetchAll();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "game_records" }, () => {
        refetchAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchAll]);

  const run = (fn: () => Promise<void>) => {
    fn().catch((err) => console.error("Supabase error:", err));
  };

  const addMember = useCallback((name: string) => {
    run(async () => {
      await supabase.from("members").insert({ name: name.trim() });
      await refetchAll();
    });
  }, [refetchAll]);

  const removeMember = useCallback((id: string) => {
    run(async () => {
      await supabase.from("members").delete().eq("id", id);
      await refetchAll();
    });
  }, [refetchAll]);

  const addRecord = useCallback((record: Omit<GameRecord, "id">) => {
    run(async () => {
      await supabase.from("game_records").insert({
        date: record.date,
        member_id: record.memberId,
        scores: record.scores,
      });
      await refetchAll();
    });
  }, [refetchAll]);

  const addRecords = useCallback((newRecords: Omit<GameRecord, "id">[]) => {
    run(async () => {
      await supabase.from("game_records").insert(
        newRecords.map((r) => ({
          date: r.date,
          member_id: r.memberId,
          scores: r.scores,
        }))
      );
      await refetchAll();
    });
  }, [refetchAll]);

  const updateRecord = useCallback((id: string, scores: (number | null)[]) => {
    run(async () => {
      await supabase.from("game_records").update({ scores }).eq("id", id);
      await refetchAll();
    });
  }, [refetchAll]);

  const updateRecordsDate = useCallback((oldDate: string, newDate: string) => {
    run(async () => {
      await supabase.from("game_records").update({ date: newDate }).eq("date", oldDate);
      await refetchAll();
    });
  }, [refetchAll]);

  const removeRecord = useCallback((id: string) => {
    run(async () => {
      await supabase.from("game_records").delete().eq("id", id);
      await refetchAll();
    });
  }, [refetchAll]);

  const sortedMembers = [...members].sort((a, b) =>
    a.name.localeCompare(b.name, "ko")
  );

  return (
    <AppContext.Provider
      value={{
        members: sortedMembers,
        records,
        loading,
        addMember,
        removeMember,
        addRecord,
        addRecords,
        updateRecord,
        updateRecordsDate,
        removeRecord,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
