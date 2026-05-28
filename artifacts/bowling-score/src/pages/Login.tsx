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

  const gradientBtn = "w-full text-white font-semibold rounded-full py-3 text-base transition-opacity hover:opacity-90 disabled:opacity-50";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900">팀 유니크</h1>
          <p className="text-gray-400 text-sm mt-1 mb-4">볼링 점수 관리 시스템</p>
          <div className="flex items-center justify-center">
            <img src="/logo.png" alt="팀 유니크 로고" className="w-56 object-contain" />
          </div>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <Input
              placeholder="아이디"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoComplete="username"
              className="rounded-full border-gray-200 bg-white shadow-none h-13 px-5 text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-blue-300"
            />
            <Input
              type="password"
              placeholder="비밀번호"
              value={loginPw}
              onChange={(e) => setLoginPw(e.target.value)}
              autoComplete="current-password"
              className="rounded-full border-gray-200 bg-white shadow-none h-13 px-5 text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-blue-300"
            />
            {loginError && <p className="text-sm text-destructive text-center pt-1">{loginError}</p>}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loginLoading || !loginId || !loginPw}
                className={gradientBtn}
                style={{ background: "linear-gradient(135deg, #a78bfa, #818cf8)" }}
              >
                {loginLoading ? "로그인 중..." : "로그인"}
              </button>
            </div>
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                계정이 없으신가요? <span className="font-medium text-indigo-400">회원가입</span>
              </button>
            </div>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup} className="space-y-3">
            <h2 className="text-base font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> 회원가입
            </h2>
            <Input placeholder="아이디" value={signupData.username} onChange={setField("username")}
              className="rounded-full border-gray-200 bg-white shadow-none h-13 px-5 text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-blue-300" />
            <Input type="password" placeholder="비밀번호" value={signupData.password} onChange={setField("password")}
              className="rounded-full border-gray-200 bg-white shadow-none h-13 px-5 text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-blue-300" />
            <Input type="password" placeholder="비밀번호 확인" value={signupData.confirmPw} onChange={setField("confirmPw")}
              className="rounded-full border-gray-200 bg-white shadow-none h-13 px-5 text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-blue-300" />
            <Input placeholder="이름" value={signupData.name} onChange={setField("name")}
              className="rounded-full border-gray-200 bg-white shadow-none h-13 px-5 text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-blue-300" />
            <Input
              placeholder="전화번호 (010-0000-0000)"
              value={signupData.phone}
              onChange={(e) => setSignupData(p => ({ ...p, phone: formatPhone(e.target.value) }))}
              className="rounded-full border-gray-200 bg-white shadow-none h-13 px-5 text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-blue-300"
              inputMode="numeric"
            />
            <Input
              placeholder="생년월일 (1900-01-01)"
              value={signupData.birthdate}
              onChange={(e) => setSignupData(p => ({ ...p, birthdate: formatBirthdate(e.target.value) }))}
              className="rounded-full border-gray-200 bg-white shadow-none h-13 px-5 text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-blue-300"
              inputMode="numeric"
            />
            {signupError && <p className="text-sm text-destructive text-center">{signupError}</p>}
            <div className="pt-1">
              <button
                type="submit"
                disabled={signupLoading}
                className={gradientBtn}
                style={{ background: "linear-gradient(135deg, #a78bfa, #818cf8)" }}
              >
                {signupLoading ? "가입 중..." : "가입 신청"}
              </button>
            </div>
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                이미 계정이 있으신가요? <span className="font-medium text-indigo-400">로그인</span>
              </button>
            </div>
          </form>
        )}

        {mode === "signup_success" && (
          <div className="text-center">
            <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">가입 신청 완료!</h2>
            <p className="text-sm text-gray-400 mb-8">관리자 승인 후 로그인하실 수 있습니다.</p>
            <button
              onClick={() => setMode("login")}
              className={gradientBtn}
              style={{ background: "linear-gradient(135deg, #a78bfa, #818cf8)" }}
            >
              로그인 화면으로
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
