import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, ErrorState } from "../../../shared/ui";
import { useSignup } from "../hooks";

export function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "", name: "", phoneNumber: "" });
  const navigate = useNavigate();
  const signupMutation = useSignup();

  function handleChange(field: keyof typeof form) {
    return (e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    signupMutation.mutate(form, { onSuccess: () => navigate("/login") });
  }

  return (
    <Card className="mx-auto max-w-sm">
      <h1 className="mb-4 font-jua text-2xl text-emerald-700">회원가입</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input placeholder="이메일" value={form.email} onChange={handleChange("email")} className="rounded-2xl border border-lavender px-3 py-2" required />
        <input type="password" placeholder="비밀번호" value={form.password} onChange={handleChange("password")} className="rounded-2xl border border-lavender px-3 py-2" required />
        <input placeholder="이름" value={form.name} onChange={handleChange("name")} className="rounded-2xl border border-lavender px-3 py-2" required />
        <input placeholder="전화번호" value={form.phoneNumber} onChange={handleChange("phoneNumber")} className="rounded-2xl border border-lavender px-3 py-2" required />
        <Button type="submit" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? "가입 중..." : "회원가입"}
        </Button>
        {signupMutation.isError && (
          <ErrorState error={{ message: "회원가입에 실패했습니다.", errors: null }} />
        )}
      </form>
    </Card>
  );
}
