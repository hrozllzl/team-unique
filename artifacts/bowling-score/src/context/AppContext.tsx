import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/password";

export interface Member {
  id: string;
  name: string;
  phone: string;
  birthdate: string;
}

export interface GameRecord {
  id: string;
  date: string;
  memberId: string;
  scores: (number | null)[];
}

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  phone: string;
  birthdate: string;
  status: "pending" | "approved";
  memberId: string | null;
}

interface AppContextType {
  members: Member[];
  records: GameRecord[];
  userAccounts: UserAccount[];
  loading: boolean;
  addMember: (name: string, phone?: string, birthdate?: string) => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, data: { name?: string; phone?: string; birthdate?: string }) => void;
  addRecord: (record: Omit<GameRecord, "id">) => void;
  addRecords: (records: Omit<GameRecord, "id">[]) => void;
  updateRecord: (id: string, scores: (number | null)[]) => void;
  updateRecordsDate: (oldDate: string, newDate: string) => void;
  removeRecord: (id: string) => void;
  addUserAccount: (account: Omit<UserAccount, "id" | "status" | "memberId">) => Promise<{ error?: string }>;
  updateUserAccount: (id: string, data: { name: string; phone: string; birthdate: string }) => Promise<{ error?: string }>;
  approveUserAccount: (accountId: string) => void;
  rejectUserAccount: (accountId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapMember = (m: any): Member => ({
  id: m.id,
  name: m.name,
  phone: m.phone ?? "",
  birthdate: m.birthdate ?? "",
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRecord = (r: any): GameRecord => ({
  id: r.id,
  date: r.date,
  memberId: r.member_id,
  scores: r.scores as (number | null)[],
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapUserAccount = (u: any): UserAccount => ({
  id: u.id,
  username: u.username,
  password: u.password,
  name: u.name,
  phone: u.phone ?? "",
  birthdate: u.birthdate ?? "",
  status: u.status,
  memberId: u.member_id ?? null,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const refetchAll = useCallback(async () => {
    const [mr, rr, ur] = await Promise.all([
      supabase.from("members").select("*").neq("is_deleted", true),
      supabase.from("game_records").select("*").order("created_at", { ascending: true }),
      supabase.from("user_accounts").select("*").order("created_at", { ascending: true }),
    ]);
    if (mr.data) setMembers(mr.data.map(mapMember));
    if (rr.data) setRecords(rr.data.map(mapRecord));
    if (ur.data) setUserAccounts(ur.data.map(mapUserAccount));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refetchAll();
      setLoading(false);
    })();

    const channel = supabase
      .channel("bowling-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, () => refetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "game_records" }, () => refetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_accounts" }, () => refetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetchAll]);

  const run = (fn: () => Promise<void>) => {
    fn().catch((err) => console.error("Supabase error:", err));
  };

  const addMember = useCallback((name: string, phone = "", birthdate = "") => {
    run(async () => {
      await supabase.from("members").insert({ name: name.trim(), phone, birthdate });
      await refetchAll();
    });
  }, [refetchAll]);

  const removeMember = useCallback((id: string) => {
    run(async () => {
      await supabase.from("members").update({ is_deleted: true }).eq("id", id);
      await supabase.from("user_accounts").delete().eq("member_id", id);
      await refetchAll();
    });
  }, [refetchAll]);

  const updateMember = useCallback((id: string, data: { name?: string; phone?: string; birthdate?: string }) => {
    run(async () => {
      await supabase.from("members").update(data).eq("id", id);
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
        newRecords.map((r) => ({ date: r.date, member_id: r.memberId, scores: r.scores }))
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

  const addUserAccount = useCallback(async (
    account: Omit<UserAccount, "id" | "status" | "memberId">
  ): Promise<{ error?: string }> => {
    const hashed = await hashPassword(account.password);
    const { error } = await supabase.from("user_accounts").insert({
      username: account.username,
      password: hashed,
      name: account.name,
      phone: account.phone,
      birthdate: account.birthdate,
      status: "pending",
    });
    if (error) {
      if (error.code === "23505") return { error: "이미 사용 중인 아이디입니다." };
      return { error: error.message };
    }
    await refetchAll();
    return {};
  }, [refetchAll]);

  const approveUserAccount = useCallback((accountId: string) => {
    run(async () => {
      const { data: account } = await supabase
        .from("user_accounts").select("*").eq("id", accountId).single();
      if (!account) return;

      const { data: existing } = await supabase
        .from("members").select("*").eq("name", account.name).neq("is_deleted", true).limit(1);

      let memberId: string;
      if (existing && existing.length > 0) {
        await supabase.from("members")
          .update({ phone: account.phone, birthdate: account.birthdate, is_deleted: false })
          .eq("id", existing[0].id);
        memberId = existing[0].id;
      } else {
        const { data: deleted } = await supabase
          .from("members").select("*").eq("name", account.name).eq("is_deleted", true).limit(1);

        if (deleted && deleted.length > 0) {
          await supabase.from("members")
            .update({ phone: account.phone, birthdate: account.birthdate, is_deleted: false })
            .eq("id", deleted[0].id);
          memberId = deleted[0].id;
        } else {
          const { data: newMember } = await supabase.from("members")
            .insert({ name: account.name, phone: account.phone, birthdate: account.birthdate })
            .select().single();
          memberId = newMember!.id;
        }
      }

      await supabase.from("user_accounts")
        .update({ status: "approved", member_id: memberId })
        .eq("id", accountId);

      await refetchAll();
    });
  }, [refetchAll]);

  const rejectUserAccount = useCallback((accountId: string) => {
    run(async () => {
      await supabase.from("user_accounts").delete().eq("id", accountId);
      await refetchAll();
    });
  }, [refetchAll]);

  const updateUserAccount = useCallback(async (
    id: string,
    data: { name: string; phone: string; birthdate: string }
  ): Promise<{ error?: string }> => {
    const { error } = await supabase.from("user_accounts").update(data).eq("id", id);
    if (error) return { error: error.message };
    await refetchAll();
    return {};
  }, [refetchAll]);

  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name, "ko"));

  return (
    <AppContext.Provider
      value={{
        members: sortedMembers,
        records,
        userAccounts,
        loading,
        addMember,
        removeMember,
        updateMember,
        addRecord,
        addRecords,
        updateRecord,
        updateRecordsDate,
        removeRecord,
        addUserAccount,
        updateUserAccount,
        approveUserAccount,
        rejectUserAccount,
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
