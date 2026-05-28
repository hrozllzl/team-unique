import { useState } from "react";
import { Users, Trash2, UserPlus, ChevronRight } from "lucide-react";
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

export default function Members() {
  const { members, addMember, removeMember } = useApp();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (name.trim()) {
      addMember(name.trim());
      setName("");
      setOpen(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-foreground">회원 관리</h1>
          <span className="ml-1 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
            {members.length}명
          </span>
        </div>
        <Button
          data-testid="button-open-add-member"
          onClick={() => setOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white gap-1.5 rounded-xl"
        >
          <UserPlus className="w-4 h-4" />
          회원 추가
        </Button>
      </div>

      <div className="border-b border-border mb-4" />

      {members.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>등록된 회원이 없습니다.</p>
          <p className="text-sm mt-1">회원 추가 버튼을 눌러 회원을 등록하세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const initial = member.name.charAt(0);
            return (
              <div
                key={member.id}
                data-testid={`member-row-${member.id}`}
                className="flex items-center justify-between px-4 py-3.5 bg-white border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                onClick={() => setLocation(`/members/${member.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {initial}
                  </div>
                  <span className="font-medium text-foreground">{member.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                  <button
                    data-testid={`button-remove-${member.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMember(member.id);
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>회원 추가</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              data-testid="input-member-name"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setName(""); }}>
              취소
            </Button>
            <Button
              data-testid="button-confirm-add"
              onClick={handleAdd}
              disabled={!name.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
