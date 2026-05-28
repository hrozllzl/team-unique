import { useState } from "react";
import { Users, Search } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { formatBirthdateDisplay } from "@/lib/scoreUtils";

export default function MemberList() {
  const { members } = useApp();
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-bold text-foreground">회원 목록</h1>
        <span className="ml-1 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
          {members.length}명
        </span>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="이름으로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{search ? "검색 결과가 없습니다." : "등록된 회원이 없습니다."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((member) => (
            <div
              key={member.id}
              className="flex items-center px-4 py-3.5 bg-white border border-border rounded-2xl shadow-sm"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm shrink-0">
                {member.name.charAt(0)}
              </div>
              <div className="ml-3">
                <span className="font-medium text-foreground">{member.name}</span>
                <div className="flex items-center gap-3 mt-0.5">
                  {member.birthdate && formatBirthdateDisplay(member.birthdate) && (
                    <span className="text-xs text-muted-foreground">{formatBirthdateDisplay(member.birthdate)}</span>
                  )}
                  {member.phone && (
                    <span className="text-xs text-muted-foreground">{member.phone}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
