import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button, Card, ErrorState, Mascot } from "../../../shared/ui";
import { useLogin } from "../hooks";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const loginMutation = useLogin();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    loginMutation.mutate(
      { email, password },
      { onSuccess: () => navigate("/") },
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative hidden overflow-hidden rounded-sm border-2 border-ink bg-surface p-10 shadow-stamp lg:flex lg:flex-col lg:justify-center"
      >
        <Mascot className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rotate-6" />
        <p className="relative mb-3 text-sm font-bold uppercase tracking-widest text-brand">Early Bird</p>
        <h1 className="relative font-display text-3xl font-bold leading-tight text-ink">
          다시 만나서 반가워요
        </h1>
        <p className="relative mt-4 max-w-sm text-mist">
          로그인하고 후원 중인 프로젝트의 진행 소식과 리워드 발송 알림을 가장 먼저 받아보세요.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
      >
        <Card className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <Mascot variant="face" className="h-8 w-8" />
            <span className="font-display text-lg font-bold text-ink">Earlybird</span>
          </div>
          <h2 className="mb-1 font-display text-2xl font-bold text-ink">로그인</h2>
          <p className="mb-6 text-sm text-mist">이메일과 비밀번호를 입력해주세요.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-sm font-semibold text-ink">
                이메일
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-sm border-2 border-ink/25 bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-semibold text-ink">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-sm border-2 border-ink/25 bg-surface px-3 py-2.5 pr-10 text-sm text-ink outline-none focus:border-ink"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-mist hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loginMutation.isPending} className="mt-2 w-full">
              {loginMutation.isPending ? "로그인 중..." : "로그인"}
            </Button>

            {loginMutation.isError && (
              <ErrorState error={{ message: "로그인에 실패했습니다.", errors: null }} />
            )}
          </form>

          <p className="mt-6 text-sm text-mist">
            계정이 없으신가요?{" "}
            <Link to="/signup" className="font-semibold text-brand underline underline-offset-2">
              회원가입
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
