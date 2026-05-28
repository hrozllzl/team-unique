import { useState } from "react";
import { Target, LogIn, UserPlus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/context/AuthContext";
import { formatPhone, formatBirthdate } from "@/lib/inputFormat";

interface LoginProps {
  onLogin: (role: UserRole, userName: string) => void;
}

type Mode = "login" | "signup" | "signup_success";

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<Mode>("login");

  // Login state
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupData, setSignupData] = useState({
    username: "", password: "", confirmPw: "", name: "", phone: "", birthdate: "",
  });
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    if (loginId === "team" && loginPw === "unique") {
      sessionStorage.setItem("bowling_auth_role", "admin");
      sessionStorage.setItem("bowling_auth_name", "관리자");
      onLogin("admin", "관리자");
      setLoginLoading(false);
      return;
    }

    const { data } = await supabase
      .from("user_accounts")
      .select("*")
      .eq("username", loginId)
      .eq("password", loginPw)
      .maybeSingle();

    if (data) {
      if (data.status === "approved") {
        sessionStorage.setItem("bowling_auth_role", "member");
        sessionStorage.setItem("bowling_auth_name", data.name);
        onLogin("member", data.name);
      } else {
        setLoginError("가입 승인 대기 중입니다. 관리자 승인 후 이용 가능합니다.");
      }
    } else {
      setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
    setLoginLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    const { username, password, confirmPw, name, phone, birthdate } = signupData;
    if (password !== confirmPw) { setSignupError("비밀번호가 일치하지 않습니다."); return; }
    if (!username || !password || !name || !phone || !birthdate) {
      setSignupError("모든 항목을 입력해 주세요."); return;
    }
    setSignupLoading(true);
    const { error } = await supabase.from("user_accounts").insert({
      username, password, name, phone, birthdate, status: "pending",
    });
    if (error) {
      setSignupError(error.code === "23505" ? "이미 사용 중인 아이디입니다." : error.message);
    } else {
      setMode("signup_success");
    }
    setSignupLoading(false);
  };

  const setField = (field: keyof typeof signupData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSignupData((prev) => ({ ...prev, [field]: e.target.value }));

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

        {mode === "login" && (
          <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">아이디</label>
                <Input placeholder="아이디를 입력하세요" value={loginId}
                  onChange={(e) => setLoginId(e.target.value)} autoComplete="username" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">비밀번호</label>
                <Input type="password" placeholder="비밀번호를 입력하세요" value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)} autoComplete="current-password" className="rounded-xl" />
              </div>
              {loginError && <p className="text-sm text-destructive text-center">{loginError}</p>}
              <Button type="submit" disabled={loginLoading || !loginId || !loginPw}
                className="w-full bg-primary text-white rounded-xl gap-2">
                <LogIn className="w-4 h-4" />
                {loginLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => setMode("signup")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors">
                계정이 없으신가요? <span className="font-medium text-primary">회원가입</span>
              </button>
            </div>
          </div>
        )}

        {mode === "signup" && (
          <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> 회원가입
            </h2>
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">아이디</label>
                <Input placeholder="사용할 아이디" value={signupData.username} onChange={setField("username")} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">비밀번호</label>
                <Input type="password" placeholder="비밀번호" value={signupData.password} onChange={setField("password")} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">비밀번호 확인</label>
                <Input type="password" placeholder="비밀번호 재입력" value={signupData.confirmPw} onChange={setField("confirmPw")} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">이름</label>
                <Input placeholder="실명 입력" value={signupData.name} onChange={setField("name")} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">전화번호</label>
                <Input
                  placeholder="01012345678"
                  value={signupData.phone}
                  onChange={(e) => setSignupData(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                  className="rounded-xl"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">생년월일</label>
                <Input
                  placeholder="19991231"
                  value={signupData.birthdate}
                  onChange={(e) => setSignupData(p => ({ ...p, birthdate: formatBirthdate(e.target.value) }))}
                  className="rounded-xl"
                  inputMode="numeric"
                />
              </div>
              {signupError && <p className="text-sm text-destructive text-center">{signupError}</p>}
              <Button type="submit" disabled={signupLoading} className="w-full bg-primary text-white rounded-xl gap-2">
                <UserPlus className="w-4 h-4" />
                {signupLoading ? "가입 중..." : "가입 신청"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => setMode("login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors">
                이미 계정이 있으신가요? <span className="font-medium text-primary">로그인</span>
              </button>
            </div>
          </div>
        )}

        {mode === "signup_success" && (
          <div className="bg-white border border-border rounded-2xl shadow-sm p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-foreground mb-2">가입 신청 완료!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              관리자 승인 후 로그인하실 수 있습니다.
            </p>
            <Button onClick={() => setMode("login")} variant="outline" className="rounded-xl">
              로그인 화면으로
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
