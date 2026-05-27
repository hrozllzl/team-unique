import { useState } from "react";
import { Target, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (id === "team" && pw === "unique") {
        sessionStorage.setItem("bowling_auth", "true");
        onLogin();
      } else {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4">
            <Target className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-primary">팀 유니크</h1>
          <p className="text-muted-foreground text-sm mt-1">볼링 점수 관리 시스템</p>
        </div>

        <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">아이디</label>
              <Input
                data-testid="input-login-id"
                placeholder="아이디를 입력하세요"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">비밀번호</label>
              <Input
                data-testid="input-login-pw"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="current-password"
                className="rounded-xl"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              data-testid="button-login"
              type="submit"
              disabled={loading || !id || !pw}
              className="w-full bg-primary text-white rounded-xl gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
