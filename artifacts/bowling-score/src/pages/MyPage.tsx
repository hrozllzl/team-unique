import { useState, useEffect } from "react";
import { User, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { formatPhone, formatBirthdate } from "@/lib/inputFormat";

export default function MyPage() {
  const { accountId } = useAuth();
  const { userAccounts, updateUserAccount } = useApp();
  const { toast } = useToast();

  const account = userAccounts.find((a) => a.id === accountId);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", birthdate: "" });

  useEffect(() => {
    if (account) {
      setForm({ name: account.name, phone: account.phone, birthdate: account.birthdate });
    }
  }, [account]);

  if (!account) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center text-muted-foreground">
        정보를 불러오는 중...
      </div>
    );
  }

  const handleEdit = () => {
    setForm({ name: account.name, phone: account.phone, birthdate: account.birthdate });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({ name: account.name, phone: account.phone, birthdate: account.birthdate });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "이름을 입력해 주세요.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await updateUserAccount(account.id, {
      name: form.name.trim(),
      phone: form.phone,
      birthdate: form.birthdate,
    });
    setSaving(false);
    if (error) {
      toast({ title: `저장 실패: ${error}`, variant: "destructive" });
    } else {
      toast({ title: "개인정보가 저장되었습니다." });
      setEditing(false);
    }
  };

  const fieldClass = "rounded-2xl border-gray-200 bg-white shadow-none h-12 px-4 text-sm focus-visible:ring-0 focus-visible:border-blue-300";
  const readonlyClass = "h-12 px-4 text-sm flex items-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-800";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <User className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{account.name}</h1>
            <p className="text-sm text-muted-foreground">@{account.username}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">개인정보</h2>
            {!editing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors font-medium"
              >
                <Pencil className="w-3.5 h-3.5" />
                수정
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 pl-1">이름</p>
              {editing ? (
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={fieldClass}
                  placeholder="이름"
                />
              ) : (
                <div className={readonlyClass}>{account.name}</div>
              )}
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1.5 pl-1">생년월일</p>
              {editing ? (
                <Input
                  value={form.birthdate.replace(/^(양력|음력)\s/, "")}
                  onChange={(e) => {
                    const prefix = form.birthdate.startsWith("음력") ? "음력 " : "양력 ";
                    setForm((p) => ({ ...p, birthdate: prefix + formatBirthdate(e.target.value) }));
                  }}
                  className={fieldClass}
                  placeholder="1990-01-01"
                  inputMode="numeric"
                />
              ) : (
                <div className={readonlyClass}>{account.birthdate || "-"}</div>
              )}
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1.5 pl-1">전화번호</p>
              {editing ? (
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
                  className={fieldClass}
                  placeholder="010-0000-0000"
                  inputMode="numeric"
                />
              ) : (
                <div className={readonlyClass}>{account.phone || "-"}</div>
              )}
            </div>
          </div>

          {editing && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-full h-11 text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
              >
                <Check className="w-4 h-4 mr-1" />
                {saving ? "저장 중..." : "저장"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 rounded-full h-11 text-sm font-semibold border-gray-200"
              >
                <X className="w-4 h-4 mr-1" />
                취소
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
