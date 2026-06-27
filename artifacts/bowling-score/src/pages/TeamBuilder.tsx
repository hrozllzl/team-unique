import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useApp, type Member, type GameRecord } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, X, GripVertical, Users, Settings, Shuffle, UserPlus,
  Plus, Link, Unlink, Save, FolderOpen, Trash2, Upload, Pencil, Check,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type ScoringMethod = "recent" | "average";
type BalancingMethod = "avg" | "total";
type ConstraintType = "together" | "apart";

type GuestMember = {
  id: string;
  name: string;
  score: number;
};

type TeamConstraint = {
  id: string;
  type: ConstraintType;
  memberA: string;
  memberB: string;
};

type MemberWithScore = {
  member: Member;
  score: number;
  isGuest?: boolean;
};

type Team = {
  id: string;
  name: string;
  members: MemberWithScore[];
};

type SavedTeamResult = {
  id: string;
  name: string;
  savedAt: number;
  teams: Team[];
  balancing: BalancingMethod;
};

const STORAGE_KEY = "bowling_saved_team_results";

function loadSavedResults(): SavedTeamResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSavedResults(results: SavedTeamResult[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {}
}

// ── Helpers ────────────────────────────────────────────────────────────────
function calcTeamAvg(team: Team) {
  if (team.members.length === 0) return 0;
  return Math.round(team.members.reduce((s, m) => s + m.score, 0) / team.members.length);
}
function calcTeamTotal(team: Team) {
  return Math.round(team.members.reduce((s, m) => s + m.score, 0));
}

function sortByScore(members: MemberWithScore[]): MemberWithScore[] {
  return [...members].sort((a, b) => b.score - a.score);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sortByTier(members: MemberWithScore[], numTeams: number): MemberWithScore[] {
  const sorted = [...members].sort((a, b) => b.score - a.score);
  const result: MemberWithScore[] = [];
  for (let i = 0; i < sorted.length; i += numTeams) {
    result.push(...shuffle(sorted.slice(i, i + numTeams)));
  }
  return result;
}

// Optimizes teams so that max-min of the given metric stays within maxDiff.
// maxDiff is now 5 (was 10) for tighter balance.
function optimizeBalance(
  teams: Team[],
  metric: (t: Team) => number,
  maxDiff = 5,
  maxIter = 3000
): Team[] {
  const result = teams.map((t) => ({ ...t, members: [...t.members] }));
  for (let iter = 0; iter < maxIter; iter++) {
    const values = result.map(metric);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    if (maxVal - minVal <= maxDiff) break;
    const maxIdx = values.indexOf(maxVal);
    const minIdx = values.indexOf(minVal);
    const maxMembers = result[maxIdx].members;
    const minMembers = result[minIdx].members;
    let bestSwap: { i: number; j: number } | null = null;
    let bestDiff = maxVal - minVal;
    for (let i = 0; i < maxMembers.length; i++) {
      for (let j = 0; j < minMembers.length; j++) {
        const tmp = maxMembers[i];
        maxMembers[i] = minMembers[j];
        minMembers[j] = tmp;
        const newValues = result.map(metric);
        const newDiff = Math.max(...newValues) - Math.min(...newValues);
        minMembers[j] = maxMembers[i];
        maxMembers[i] = tmp;
        if (newDiff < bestDiff) {
          bestDiff = newDiff;
          bestSwap = { i, j };
        }
      }
    }
    if (!bestSwap) break;
    const tmp = maxMembers[bestSwap.i];
    maxMembers[bestSwap.i] = minMembers[bestSwap.j];
    minMembers[bestSwap.j] = tmp;
    if (bestDiff <= maxDiff) break;
  }
  return result;
}

// Apply together/apart constraints via best-available swaps.
function applyConstraints(teams: Team[], constraints: TeamConstraint[]): Team[] {
  const result = teams.map((t) => ({ ...t, members: [...t.members] }));

  for (const c of constraints) {
    const { type, memberA, memberB } = c;
    const idxA = result.findIndex((t) => t.members.some((m) => m.member.id === memberA));
    const idxB = result.findIndex((t) => t.members.some((m) => m.member.id === memberB));
    if (idxA === -1 || idxB === -1) continue;

    if (type === "together" && idxA !== idxB) {
      const teamA = result[idxA];
      const teamB = result[idxB];
      const mBObj = teamB.members.find((m) => m.member.id === memberB)!;
      let bestI = -1, bestImbalance = Infinity;
      for (let i = 0; i < teamA.members.length; i++) {
        if (teamA.members[i].member.id === memberA) continue;
        const swap = teamA.members[i];
        const newAvgA = (calcTeamTotal(teamA) - swap.score + mBObj.score) / teamA.members.length;
        const newAvgB = (calcTeamTotal(teamB) - mBObj.score + swap.score) / teamB.members.length;
        const imbalance = Math.abs(newAvgA - newAvgB);
        if (imbalance < bestImbalance) { bestImbalance = imbalance; bestI = i; }
      }
      if (bestI !== -1) {
        const tmp = teamA.members[bestI];
        teamA.members[bestI] = mBObj;
        const bPos = teamB.members.findIndex((m) => m.member.id === memberB);
        teamB.members[bPos] = tmp;
      }
    } else if (type === "apart" && idxA === idxB) {
      const sameTeam = result[idxA];
      const mBObj = sameTeam.members.find((m) => m.member.id === memberB)!;
      let bestTgt = -1, bestI = -1, bestImbalance = Infinity;
      for (let t = 0; t < result.length; t++) {
        if (t === idxA) continue;
        const tgt = result[t];
        for (let i = 0; i < tgt.members.length; i++) {
          const swap = tgt.members[i];
          const newSameAvg = (calcTeamTotal(sameTeam) - mBObj.score + swap.score) / sameTeam.members.length;
          const newTgtAvg = (calcTeamTotal(tgt) - swap.score + mBObj.score) / tgt.members.length;
          const imbalance = Math.abs(newSameAvg - newTgtAvg);
          if (imbalance < bestImbalance) { bestImbalance = imbalance; bestTgt = t; bestI = i; }
        }
      }
      if (bestTgt !== -1 && bestI !== -1) {
        const tgt = result[bestTgt];
        const tmp = tgt.members[bestI];
        const bPos = sameTeam.members.findIndex((m) => m.member.id === memberB);
        tgt.members[bestI] = mBObj;
        sameTeam.members[bPos] = tmp;
      }
    }
  }
  return result;
}

// Snake-draft (평균 일치) — optimize by avg
function buildTeamsAvg(members: MemberWithScore[], numTeams: number, constraints: TeamConstraint[]): Team[] {
  const teams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
    id: `team-${i + 1}`, name: `팀 ${i + 1}`, members: [],
  }));
  const tiered = sortByTier(members, numTeams);
  tiered.forEach((m, idx) => {
    const round = Math.floor(idx / numTeams);
    const pos = idx % numTeams;
    const teamIdx = round % 2 === 0 ? pos : numTeams - 1 - pos;
    teams[teamIdx].members.push(m);
  });
  return applyConstraints(optimizeBalance(teams, calcTeamAvg, 5), constraints);
}

// Greedy (총점 일치) — optimize by total
function buildTeamsTotal(members: MemberWithScore[], numTeams: number, constraints: TeamConstraint[]): Team[] {
  const teams: Team[] = Array.from({ length: numTeams }, (_, i) => ({
    id: `team-${i + 1}`, name: `팀 ${i + 1}`, members: [],
  }));
  const remaining = [...members].sort((a, b) => b.score - a.score);
  while (remaining.length > 0) {
    const maxScore = remaining[0].score;
    const bandEnd = remaining.findIndex((m) => maxScore - m.score > 10);
    const bandSize = bandEnd === -1 ? remaining.length : bandEnd;
    const pickIdx = Math.floor(Math.random() * bandSize);
    const [player] = remaining.splice(pickIdx, 1);
    const totals = teams.map(calcTeamTotal);
    const minTotal = Math.min(...totals);
    const candidates = teams.filter((_, i) => totals[i] === minTotal);
    candidates[Math.floor(Math.random() * candidates.length)].members.push(player);
  }
  return applyConstraints(optimizeBalance(teams, calcTeamTotal, 5), constraints);
}

// ── SortableMemberCard ─────────────────────────────────────────────────────
function SortableMemberCard({
  mws,
  teamId,
  overlay = false,
  onDelete,
}: {
  mws: MemberWithScore;
  teamId: string;
  overlay?: boolean;
  onDelete?: () => void;
}) {
  const id = `${teamId}::${mws.member.id}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-card-border text-sm select-none
        ${isDragging && !overlay ? "opacity-40" : ""}
        ${overlay ? "shadow-lg ring-2 ring-primary/40" : "hover:bg-muted/30"}
      `}
    >
      <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground">
        <GripVertical className="w-4 h-4" />
      </span>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${mws.isGuest ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"}`}>
        {mws.member.name[0]}
      </div>
      <span className="flex-1 font-medium">{mws.member.name}{mws.isGuest && <span className="ml-1 text-xs text-amber-500">G</span>}</span>
      <span className={`font-medium ${Math.round(mws.score) >= 200 ? "text-red-500" : "text-muted-foreground"}`}>
        {Math.round(mws.score)}점
      </span>
      {!overlay && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-5 h-5 rounded-full flex items-center justify-center bg-rose-100 text-rose-400 hover:bg-rose-200 transition-colors shrink-0"
          title="팀에서 제거"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── TeamColumn ─────────────────────────────────────────────────────────────
function TeamColumn({
  team,
  isOver,
  perTeamTarget,
  deletedMembers,
  onDeleteMember,
  onAddMember,
  addingMode,
  onSetAddingMode,
}: {
  team: Team;
  isOver: boolean;
  perTeamTarget: number;
  deletedMembers: MemberWithScore[];
  onDeleteMember: (memberId: string) => void;
  onAddMember: (mws: MemberWithScore) => void;
  addingMode: boolean;
  onSetAddingMode: (v: boolean) => void;
}) {
  const { setNodeRef } = useDroppable({ id: team.id });
  const itemIds = team.members.map((m) => `${team.id}::${m.member.id}`);
  const needsMore = perTeamTarget > 0 && team.members.length < perTeamTarget;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-xl border-2 p-3 min-h-[120px] transition-colors
        ${isOver ? "border-primary/50 bg-primary/5" : "border-card-border bg-card"}`}
    >
      <div className="flex items-center justify-between pb-1 border-b border-card-border mb-1">
        <span className="font-bold text-sm">{team.name}</span>
        <div className="flex gap-2 text-xs">
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">평균 {calcTeamAvg(team)}점</span>
          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">총 {calcTeamTotal(team)}점</span>
        </div>
      </div>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {team.members.map((mws) => (
          <SortableMemberCard
            key={mws.member.id}
            mws={mws}
            teamId={team.id}
            onDelete={() => onDeleteMember(mws.member.id)}
          />
        ))}
      </SortableContext>
      {team.members.length === 0 && !needsMore && (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/50 italic py-4">여기에 드롭하세요</div>
      )}

      {needsMore && (
        <div className="mt-1">
          {addingMode && deletedMembers.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium px-1 mb-1">추가할 회원 선택</p>
              {deletedMembers.map((mws) => (
                <button
                  key={mws.member.id}
                  onClick={() => { onAddMember(mws); onSetAddingMode(false); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-primary/40 hover:bg-primary/5 text-sm transition-colors"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${mws.isGuest ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"}`}>
                    {mws.member.name[0]}
                  </div>
                  <span className="flex-1 font-medium">{mws.member.name}</span>
                  <span className="text-xs text-muted-foreground">{Math.round(mws.score)}점</span>
                </button>
              ))}
              <button
                onClick={() => onSetAddingMode(false)}
                className="w-full py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSetAddingMode(true)}
              disabled={deletedMembers.length === 0}
              className="w-full py-1.5 rounded-lg border border-dashed border-primary/30 text-xs text-primary hover:bg-primary/5 flex items-center justify-center gap-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
              팀원 추가 ({perTeamTarget - team.members.length}명 부족)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── SavedResultsPanel ───────────────────────────────────────────────────────
function SavedResultsPanel({
  savedResults,
  hasBuilt,
  loadedId,
  onSave,
  onLoad,
  onUpdate,
  onDelete,
  onRename,
}: {
  savedResults: SavedTeamResult[];
  hasBuilt: boolean;
  loadedId: string | null;
  onSave: (name: string) => void;
  onLoad: (result: SavedTeamResult) => void;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [saveName, setSaveName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function handleSave() {
    const name = saveName.trim();
    if (!name || !hasBuilt) return;
    onSave(name);
    setSaveName("");
  }

  function startEdit(r: SavedTeamResult) {
    setEditingId(r.id);
    setEditName(r.name);
  }

  function commitEdit(id: string) {
    const name = editName.trim();
    if (name) onRename(id, name);
    setEditingId(null);
  }

  function formatDate(ts: number) {
    const d = new Date(ts);
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const DD = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${MM}/${DD} ${hh}:${mm}`;
  }

  return (
    <div className="space-y-3">
      {/* 저장하기 */}
      <Card className="border-card-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Save className="w-4 h-4" />
            배정 결과 저장
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="저장명 입력"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="border border-input rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring flex-1 min-w-0"
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim() || !hasBuilt}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="현재 배정을 새 이름으로 저장"
            >
              저장
            </button>
          </div>
          {!hasBuilt && (
            <p className="text-xs text-muted-foreground mt-1.5">팀 배정 후 저장할 수 있습니다</p>
          )}
        </CardContent>
      </Card>

      {/* 저장된 목록 */}
      <Card className="border-card-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            저장된 배정
            <Badge variant="secondary" className="text-xs ml-auto">{savedResults.length}개</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedResults.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">저장된 배정이 없습니다</p>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-0.5">
              {savedResults.map((r) => {
                const isLoaded = loadedId === r.id;
                return (
                  <div
                    key={r.id}
                    className={`rounded-lg border overflow-hidden ${isLoaded ? "border-primary/50 bg-primary/5" : "border-card-border bg-muted/10"}`}
                  >
                    <div className="flex items-center gap-1.5 px-2.5 py-2">
                      {editingId === r.id ? (
                        <>
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit(r.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="flex-1 border border-input rounded px-2 py-0.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring min-w-0"
                          />
                          <button
                            onClick={() => commitEdit(r.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(r.savedAt)}</p>
                            <p className="text-xs text-muted-foreground">{r.teams.length}팀 · {r.teams.reduce((s, t) => s + t.members.length, 0)}명</p>
                          </div>
                          <button
                            onClick={() => startEdit(r)}
                            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                            title="이름 수정"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          {isLoaded ? (
                            <button
                              onClick={() => onUpdate(r.id)}
                              className="w-6 h-6 rounded flex items-center justify-center text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors shrink-0"
                              title="현재 수정 내용으로 덮어쓰기"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onLoad(r)}
                              className="w-6 h-6 rounded flex items-center justify-center text-primary hover:bg-primary/10 transition-colors shrink-0"
                              title="불러오기"
                            >
                              <Upload className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(r.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-rose-400 hover:bg-rose-50 transition-colors shrink-0"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Helpers: score from AppContext records ──────────────────────────────────
function calcMemberScore(
  member: Member,
  records: GameRecord[],
  scoring: ScoringMethod
): number {
  const memberRecords = records
    .filter((r) => r.memberId === member.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (memberRecords.length === 0) return 0;

  if (scoring === "recent") {
    const latest = memberRecords[0];
    const valid = (latest.scores || []).filter((s): s is number => s !== null && !isNaN(Number(s)));
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
  } else {
    let total = 0, count = 0;
    for (const rec of memberRecords) {
      const valid = (rec.scores || []).filter((s): s is number => s !== null && !isNaN(Number(s)));
      total += valid.reduce((a, b) => a + b, 0);
      count += valid.length;
    }
    return count ? Math.round(total / count) : 0;
  }
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function TeamBuilder() {
  const [, setLocation] = useLocation();
  const { members, records, loading } = useApp();
  const { toast } = useToast();

  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [numTeams, setNumTeams] = useState(2);
  const [scoring, setScoring] = useState<ScoringMethod>("average");
  const [balancing, setBalancing] = useState<BalancingMethod>("avg");
  const [teams, setTeams] = useState<Team[]>([]);
  const [buildCount, setBuildCount] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [hasBuilt, setHasBuilt] = useState(false);

  const [perTeamTarget, setPerTeamTarget] = useState(0);
  const [deletedFromTeam, setDeletedFromTeam] = useState<MemberWithScore[]>([]);
  const [addingToTeamId, setAddingToTeamId] = useState<string | null>(null);

  // Guests
  const [guests, setGuests] = useState<GuestMember[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestScore, setGuestScore] = useState("");

  // Constraints
  const [constraints, setConstraints] = useState<TeamConstraint[]>([]);

  // Saved results
  const [savedResults, setSavedResults] = useState<SavedTeamResult[]>(() => loadSavedResults());
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    persistSavedResults(savedResults);
  }, [savedResults]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const regularMemberScores = useMemo((): MemberWithScore[] => {
    return members
      .filter((m) => !excludedIds.has(m.id))
      .map((member) => ({
        member,
        score: calcMemberScore(member, records, scoring),
      }))
      .sort((a, b) => a.member.name.localeCompare(b.member.name, "ko"));
  }, [members, records, excludedIds, scoring]);

  const guestScores = useMemo((): MemberWithScore[] => {
    return guests
      .filter((g) => !excludedIds.has(g.id))
      .map((g) => ({
        member: { id: g.id, name: g.name, phone: "", birthdate: "" } as Member,
        score: g.score,
        isGuest: true,
      }));
  }, [guests, excludedIds]);

  const memberScores = useMemo(
    () => [...regularMemberScores, ...guestScores],
    [regularMemberScores, guestScores]
  );

  const allParticipants = useMemo(
    () => memberScores.map((mws) => ({ id: mws.member.id, name: mws.member.name, isGuest: mws.isGuest })),
    [memberScores]
  );

  function addGuest() {
    const name = guestName.trim();
    const score = parseInt(guestScore, 10);
    if (!name || isNaN(score) || score < 0 || score > 300) return;
    setGuests((prev) => [...prev, { id: `guest-${Date.now()}`, name, score }]);
    setGuestName("");
    setGuestScore("");
  }

  function removeGuest(id: string) {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    setExcludedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setConstraints((prev) => prev.filter((c) => c.memberA !== id && c.memberB !== id));
  }

  function addConstraint() {
    if (allParticipants.length < 2) return;
    const a = allParticipants[0].id;
    const b = allParticipants[1].id;
    setConstraints((prev) => [...prev, { id: `c-${Date.now()}`, type: "apart", memberA: a, memberB: b }]);
  }

  function updateConstraint(id: string, patch: Partial<TeamConstraint>) {
    setConstraints((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeConstraint(id: string) {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
  }

  function buildTeams() {
    if (memberScores.length === 0) return;
    const n = Math.min(numTeams, memberScores.length);
    const validConstraints = constraints.filter(
      (c) => c.memberA !== c.memberB &&
        memberScores.some((m) => m.member.id === c.memberA) &&
        memberScores.some((m) => m.member.id === c.memberB)
    );
    const built = balancing === "avg"
      ? buildTeamsAvg(memberScores, n, validConstraints)
      : buildTeamsTotal(memberScores, n, validConstraints);
    const sorted = built.map((t) => ({ ...t, members: sortByScore(t.members) }));
    setTeams(sorted);
    setBuildCount((c) => c + 1);
    setHasBuilt(true);
    setDeletedFromTeam([]);
    setPerTeamTarget(Math.ceil(memberScores.length / n));
    setAddingToTeamId(null);
    setLoadedId(null);
  }

  // ── Saved results handlers ──────────────────────────────────────────────
  function handleSave(name: string) {
    const newResult: SavedTeamResult = {
      id: `save-${Date.now()}`,
      name,
      savedAt: Date.now(),
      teams: teams.map((t) => ({ ...t, members: [...t.members] })),
      balancing,
    };
    setSavedResults((prev) => [newResult, ...prev]);
    setLoadedId(newResult.id);
  }

  function handleLoad(result: SavedTeamResult) {
    setTeams(result.teams.map((t) => ({ ...t, members: [...t.members] })));
    setHasBuilt(true);
    setBuildCount((c) => c + 1);
    setDeletedFromTeam([]);
    const totalMembers = result.teams.reduce((s, t) => s + t.members.length, 0);
    setPerTeamTarget(Math.ceil(totalMembers / result.teams.length));
    setAddingToTeamId(null);
    setLoadedId(result.id);
    toast({ title: `'${result.name}' 배정을 불러왔습니다` });
  }

  function handleUpdate(id: string) {
    const target = savedResults.find((r) => r.id === id);
    setSavedResults((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, savedAt: Date.now(), teams: teams.map((t) => ({ ...t, members: [...t.members] })) }
          : r
      )
    );
    if (target) toast({ title: `'${target.name}' 배정이 수정되었습니다` });
  }

  function handleDelete(id: string) {
    setSavedResults((prev) => prev.filter((r) => r.id !== id));
    if (loadedId === id) setLoadedId(null);
  }

  function handleRename(id: string, name: string) {
    setSavedResults((prev) => prev.map((r) => r.id === id ? { ...r, name } : r));
  }

  // ── Team manipulation handlers ──────────────────────────────────────────
  const handleDeleteFromTeam = useCallback((teamId: string, memberId: string) => {
    setTeams((prev) => {
      const team = prev.find((t) => t.id === teamId);
      const mws = team?.members.find((m) => m.member.id === memberId);
      if (mws) setDeletedFromTeam((d) => [...d, mws]);
      return prev.map((t) =>
        t.id === teamId ? { ...t, members: t.members.filter((m) => m.member.id !== memberId) } : t
      );
    });
  }, []);

  const handleAddToTeam = useCallback((teamId: string, mws: MemberWithScore) => {
    setDeletedFromTeam((prev) => prev.filter((m) => m.member.id !== mws.member.id));
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, members: sortByScore([...t.members, mws]) } : t
      )
    );
  }, []);

  function findTeamByDragId(id: string): Team | undefined {
    return teams.find((t) => t.members.some((m) => `${t.id}::${m.member.id}` === id));
  }
  function findTeamById(id: string): Team | undefined {
    return teams.find((t) => t.id === id);
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over ? String(event.over.id) : null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      setOverId(null);
      const { active, over } = event;
      if (!over) return;
      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);
      if (activeIdStr === overIdStr) return;

      const sourceTeam = findTeamByDragId(activeIdStr);
      if (!sourceTeam) return;
      const memberId = activeIdStr.split("::")[1];
      const movingMember = sourceTeam.members.find((m) => m.member.id === memberId);
      if (!movingMember) return;

      let targetTeam = findTeamById(overIdStr);
      if (!targetTeam) targetTeam = findTeamByDragId(overIdStr);

      if (!targetTeam || targetTeam.id === sourceTeam.id) {
        setTeams((prev) =>
          prev.map((t) => {
            if (t.id !== sourceTeam.id) return t;
            return { ...t, members: sortByScore(t.members) };
          })
        );
        return;
      }

      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === sourceTeam!.id) {
            return { ...t, members: sortByScore(t.members.filter((m) => m.member.id !== memberId)) };
          }
          if (t.id === targetTeam!.id) {
            return { ...t, members: sortByScore([...t.members, movingMember!]) };
          }
          return t;
        })
      );
    },
    [teams]
  );

  const activeMember = useMemo(() => {
    if (!activeId) return null;
    const team = findTeamByDragId(activeId);
    if (!team) return null;
    const memberId = activeId.split("::")[1];
    return { mws: team.members.find((m) => m.member.id === memberId)!, teamId: team.id };
  }, [activeId, teams]);

  const overTeamId = useMemo(() => {
    if (!overId) return null;
    const directTeam = findTeamById(overId);
    if (directTeam) return directTeam.id;
    return findTeamByDragId(overId)?.id || null;
  }, [overId, teams]);

  const selectCls = "border border-input rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer";

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setLocation("/")}
            className="w-8 h-8 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-bold">팀 짜기</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-6">
            {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* 참여 회원 */}
              <Card className="border-card-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    참여 회원
                    <Badge variant="secondary" className="text-xs ml-auto">{memberScores.length}명</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {members.map((member) => {
                    const excluded = excludedIds.has(member.id);
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                          excluded ? "border-dashed border-muted opacity-40 bg-muted/10" : "border-gray-100 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {member.name[0]}
                        </div>
                        <span className="flex-1 font-medium">{member.name}</span>
                        <button
                          onClick={() => setExcludedIds((prev) => { const n = new Set(prev); excluded ? n.delete(member.id) : n.add(member.id); return n; })}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors text-xs font-bold ${
                            excluded ? "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary" : "bg-rose-100 text-rose-500 hover:bg-rose-200"
                          }`}
                          title={excluded ? "복귀" : "제외"}
                        >
                          {excluded ? "+" : <X className="w-3 h-3" />}
                        </button>
                      </div>
                    );
                  })}
                  {guests.map((guest) => {
                    const excluded = excludedIds.has(guest.id);
                    return (
                      <div
                        key={guest.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                          excluded ? "border-dashed border-muted opacity-40 bg-muted/10" : "border-amber-100 bg-amber-50/50 hover:bg-amber-50"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600">
                          {guest.name[0]}
                        </div>
                        <span className="flex-1 font-medium">{guest.name}</span>
                        <span className="text-xs text-amber-600 font-medium mr-1">{guest.score}점</span>
                        <button
                          onClick={() => setExcludedIds((prev) => { const n = new Set(prev); excluded ? n.delete(guest.id) : n.add(guest.id); return n; })}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors text-xs font-bold ${
                            excluded ? "bg-muted text-muted-foreground hover:bg-amber-100 hover:text-amber-600" : "bg-amber-100 text-amber-500 hover:bg-amber-200"
                          }`}
                          title={excluded ? "복귀" : "제외"}
                        >
                          {excluded ? "+" : <X className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => removeGuest(guest.id)}
                          className="w-5 h-5 rounded-full flex items-center justify-center bg-rose-100 text-rose-400 hover:bg-rose-200 transition-colors"
                          title="게스트 삭제"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* 게스트 추가 */}
              <Card className="border-card-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    게스트 추가
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="이름"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addGuest()}
                      className="border border-input rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring flex-1 min-w-0"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="점수"
                      value={guestScore}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        if (v === "" || parseInt(v) <= 300) setGuestScore(v);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && addGuest()}
                      className="border border-input rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring w-16 text-center"
                    />
                    <button
                      onClick={addGuest}
                      disabled={!guestName.trim() || !guestScore}
                      className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                    >
                      추가
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* 조건 설정 */}
              <Card className="border-card-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    조건 설정
                    <button
                      onClick={addConstraint}
                      disabled={allParticipants.length < 2}
                      className="ml-auto flex items-center gap-1 text-xs bg-secondary hover:bg-muted px-2 py-1 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-foreground"
                    >
                      <Plus className="w-3 h-3" />
                      추가
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {constraints.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">조건이 없습니다</p>
                  )}
                  {constraints.map((c) => (
                    <div key={c.id} className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-card-border bg-muted/20">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={c.type}
                          onChange={(e) => updateConstraint(c.id, { type: e.target.value as ConstraintType })}
                          className={`${selectCls} flex-1 text-xs`}
                        >
                          <option value="apart">같은 팀 ✗ (붙이지 않기)</option>
                          <option value="together">같은 팀 ✓ (붙이기)</option>
                        </select>
                        <button onClick={() => removeConstraint(c.id)} className="text-muted-foreground/50 hover:text-rose-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={c.memberA}
                          onChange={(e) => updateConstraint(c.id, { memberA: e.target.value })}
                          className={`${selectCls} flex-1 text-xs`}
                        >
                          {allParticipants.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}{p.isGuest ? " (G)" : ""}</option>
                          ))}
                        </select>
                        {c.type === "apart"
                          ? <Unlink className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          : <Link className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        }
                        <select
                          value={c.memberB}
                          onChange={(e) => updateConstraint(c.id, { memberB: e.target.value })}
                          className={`${selectCls} flex-1 text-xs`}
                        >
                          {allParticipants.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}{p.isGuest ? " (G)" : ""}</option>
                          ))}
                        </select>
                      </div>
                      {c.memberA === c.memberB && (
                        <p className="text-xs text-rose-500">같은 회원을 선택했습니다</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 팀 설정 */}
              <Card className="border-card-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    팀 설정
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-2">팀 개수</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNumTeams((n) => Math.max(2, n - 1))}
                        className="w-8 h-8 rounded-lg bg-secondary hover:bg-muted text-secondary-foreground font-bold transition-colors"
                      >−</button>
                      <span className="w-10 text-center font-bold text-lg">{numTeams}</span>
                      <button
                        onClick={() => setNumTeams((n) => Math.min(Math.max(2, memberScores.length), n + 1))}
                        className="w-8 h-8 rounded-lg bg-secondary hover:bg-muted text-secondary-foreground font-bold transition-colors"
                      >+</button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-2">능력치 기준</label>
                    <div className="flex gap-2">
                      {(["average", "recent"] as ScoringMethod[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setScoring(m)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            scoring === m ? "border border-primary bg-primary/10 text-primary font-semibold" : "border border-transparent bg-secondary text-secondary-foreground hover:bg-muted"
                          }`}
                        >
                          {m === "average" ? "평균 점수" : "최근 점수"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-2">팀 짜기 방식</label>
                    <div className="flex gap-2">
                      {(["avg", "total"] as BalancingMethod[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setBalancing(m)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            balancing === m ? "border border-primary bg-primary/10 text-primary font-semibold" : "border border-transparent bg-secondary text-secondary-foreground hover:bg-muted"
                          }`}
                        >
                          {m === "avg" ? "평균 일치" : "총점 일치"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={buildTeams}
                    disabled={memberScores.length < numTeams}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Shuffle className="w-4 h-4" />
                    팀 짜기
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* ── MIDDLE: Team columns ─────────────────────────────────── */}
            <div>
              {!hasBuilt ? (
                <div className="h-full flex items-center justify-center min-h-[300px] rounded-2xl border-2 border-dashed border-card-border bg-card">
                  <div className="text-center text-muted-foreground">
                    <Shuffle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">설정 후 팀 짜기 버튼을 누르세요</p>
                    <p className="text-xs mt-1 opacity-60">팀 배정 결과가 여기에 표시됩니다</p>
                  </div>
                </div>
              ) : (
                <DndContext
                  key={buildCount}
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                >
                  <div
                    className={`grid gap-4 ${
                      teams.length <= 2 ? "grid-cols-1 sm:grid-cols-2"
                        : teams.length <= 4 ? "grid-cols-2"
                        : "grid-cols-2 xl:grid-cols-3"
                    }`}
                  >
                    {teams.map((team) => (
                      <TeamColumn
                        key={team.id}
                        team={team}
                        isOver={overTeamId === team.id}
                        perTeamTarget={perTeamTarget}
                        deletedMembers={deletedFromTeam}
                        onDeleteMember={(memberId) => handleDeleteFromTeam(team.id, memberId)}
                        onAddMember={(mws) => handleAddToTeam(team.id, mws)}
                        addingMode={addingToTeamId === team.id}
                        onSetAddingMode={(v) => setAddingToTeamId(v ? team.id : null)}
                      />
                    ))}
                  </div>
                  <DragOverlay>
                    {activeMember && (
                      <SortableMemberCard mws={activeMember.mws} teamId={activeMember.teamId} overlay />
                    )}
                  </DragOverlay>
                </DndContext>
              )}
            </div>

            {/* ── RIGHT: Saved results panel ───────────────────────────── */}
            <div>
              <SavedResultsPanel
                savedResults={savedResults}
                hasBuilt={hasBuilt}
                loadedId={loadedId}
                onSave={handleSave}
                onLoad={handleLoad}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
