import { createContext, useContext, useState, useEffect, useCallback } from "react";

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
  addMember: (name: string) => void;
  removeMember: (id: string) => void;
  addRecord: (record: Omit<GameRecord, "id">) => void;
  addRecords: (records: Omit<GameRecord, "id">[]) => void;
  updateRecord: (id: string, scores: (number | null)[]) => void;
  removeRecord: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const MEMBERS_KEY = "bowling_members";
const RECORDS_KEY = "bowling_records";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const stored = localStorage.getItem(MEMBERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [records, setRecords] = useState<GameRecord[]>(() => {
    try {
      const stored = localStorage.getItem(RECORDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  const addMember = useCallback((name: string) => {
    setMembers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: name.trim() },
    ]);
  }, []);

  const removeMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setRecords((prev) => prev.filter((r) => r.memberId !== id));
  }, []);

  const addRecord = useCallback((record: Omit<GameRecord, "id">) => {
    setRecords((prev) => [...prev, { ...record, id: crypto.randomUUID() }]);
  }, []);

  const addRecords = useCallback((newRecords: Omit<GameRecord, "id">[]) => {
    setRecords((prev) => [
      ...prev,
      ...newRecords.map((r) => ({ ...r, id: crypto.randomUUID() })),
    ]);
  }, []);

  const updateRecord = useCallback((id: string, scores: (number | null)[]) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, scores } : r))
    );
  }, []);

  const removeRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{ members, records, addMember, removeMember, addRecord, addRecords, updateRecord, removeRecord }}
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
