import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Card, ErrorState } from "../../../shared/ui";
import { useLogin } from "../hooks";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <Card className="mx-auto max-w-sm">
      <h1 className="mb-4 font-jua text-2xl text-emerald-700">로그인</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl border border-lavender px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-2xl border border-lavender px-3 py-2"
          required
        />
        <Button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "로그인 중..." : "로그인"}
        </Button>
        {loginMutation.isError && (
          <ErrorState error={{ message: "로그인에 실패했습니다.", errors: null }} />
        )}
      </form>
      <p className="mt-3 text-sm text-slate-500">
        계정이 없으신가요? <Link to="/signup" className="text-emerald-700 underline">회원가입</Link>
      </p>
    </Card>
  );
}
