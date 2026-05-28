import { useState } from "react";
import { Users, Trash2, UserPlus, ChevronRight, Pencil, Check, X, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Tab = "members" | "pending";

export default function Members() {
  const { members, userAccounts, addMember, removeMember, updateMember, approveUserAccount, rejectUserAccount } = useApp();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("members");
  const pendingAccounts = userAccounts.filter((u) => u.status === "pending");

  // Add member dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newBirthdate, setNewBirthdate] = useState("");

  // Edit member dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirthdate, setEditBirthdate] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    addMember(newName.trim(), newPhone, newBirthdate);
    setNewName(""); setNewPhone(""); setNewBirthdate("");
    setAddOpen(false);
    toast({ title: "회원이 추가되었습니다." });
  };

  const openEdit = (id: string, name: string, phone: string, birthdate: string) => {
    setEditId(id); setEditName(name); setEditPhone(phone); setEditBirthdate(birthdate);
    setEditOpen(true);
  };

  const handleEditSave = () => {
    if (!editName.trim()) return;
    updateMember(editId, { name: editName.trim(), phone: editPhone, birthdate: editBirthdate });
    setEditOpen(false);
    toast({ title: "회원 정보가 수정되었습니다." });
  };

  const handleApprove = (id: string, name: string) => {
    approveUserAccount(id);
    toast({ title: `${name}님 가입을 승인했습니다.` });
  };

  const handleReject = (id: string, name: string) => {
    rejectUserAccount(id);
    toast({ title: `${name}님 가입 요청을 거절했습니다.` });
  };

  const formatBirthdate = (bd: string) => {
    if (!bd) return null;
    try {
      const d = new Date(bd + "T00:00:00");
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    } catch { return bd; }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-foreground">회원 관리</h1>
          <span className="ml-1 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
            {members.length}명
          </span>
        </div>
        {tab === "members" && (
          <Button onClick={() => setAddOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white gap-1.5 rounded-xl">
            <UserPlus className="w-4 h-4" />
            회원 추가
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab("members")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === "members" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          팀원 목록
        </button>
        <button
          onClick={() => setTab("pending")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${tab === "pending" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          가입 요청
          {pendingAccounts.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
              {pendingAccounts.length}
            </span>
          )}
        </button>
      </div>

      {/* Members Tab */}
      {tab === "members" && (
        members.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>등록된 회원이 없습니다.</p>
            <p className="text-sm mt-1">회원 추가 버튼을 눌러 등록하세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between px-4 py-3.5 bg-white border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => setLocation(`/members/${member.id}`)}
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{member.name}</span>
                    <div className="flex items-center gap-3 mt-0.5">
                      {member.birthdate && (
                        <span className="text-xs text-muted-foreground">{formatBirthdate(member.birthdate)}</span>
                      )}
                      {member.phone && (
                        <span className="text-xs text-muted-foreground">{member.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" onClick={() => setLocation(`/members/${member.id}`)} />
                  <button
                    onClick={() => openEdit(member.id, member.name, member.phone, member.birthdate)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                    title="수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Pending Tab */}
      {tab === "pending" && (
        pendingAccounts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>대기 중인 가입 요청이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAccounts.map((account) => (
              <div key={account.id} className="bg-white border border-border rounded-2xl shadow-sm px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold text-sm shrink-0">
                      {account.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{account.name}</span>
                        <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">@{account.username}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {account.birthdate && (
                          <span className="text-xs text-muted-foreground">{formatBirthdate(account.birthdate)}</span>
                        )}
                        {account.phone && (
                          <span className="text-xs text-muted-foreground">{account.phone}</span>
                        )}
                      </div>
                      {members.find((m) => m.name === account.name) && (
                        <span className="text-xs text-teal-600 font-medium mt-0.5 block">
                          ✓ 기존 회원과 이름 일치 — 승인 시 정보 업데이트
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(account.id, account.name)}
                      className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl gap-1 h-8 px-3"
                    >
                      <Check className="w-3.5 h-3.5" />
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(account.id, account.name)}
                      className="rounded-xl gap-1 h-8 px-3 hover:border-destructive hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                      거절
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Add Member Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>회원 추가</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">이름 *</label>
              <Input placeholder="이름" value={newName} onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()} autoFocus className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">전화번호 (선택)</label>
              <Input placeholder="010-0000-0000" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">생년월일 (선택)</label>
              <input type="date" value={newBirthdate} onChange={(e) => setNewBirthdate(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setNewName(""); setNewPhone(""); setNewBirthdate(""); }}>취소</Button>
            <Button onClick={handleAdd} disabled={!newName.trim()} className="bg-blue-500 hover:bg-blue-600 text-white">추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>회원 정보 수정</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">이름</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">전화번호</label>
              <Input placeholder="010-0000-0000" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">생년월일</label>
              <input type="date" value={editBirthdate} onChange={(e) => setEditBirthdate(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>취소</Button>
            <Button onClick={handleEditSave} disabled={!editName.trim()} className="bg-blue-500 hover:bg-blue-600 text-white">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
