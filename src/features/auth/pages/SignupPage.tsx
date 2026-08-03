import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, Card, ErrorState, Mascot } from "../../../shared/ui";
import { useSignup } from "../hooks";

const fields: { key: "email" | "password" | "name" | "phoneNumber"; label: string; type: string; placeholder: string; autoComplete: string }[] = [
  { key: "email", label: "이메일", type: "email", placeholder: "you@example.com", autoComplete: "email" },
  { key: "password", label: "비밀번호", type: "password", placeholder: "••••••••", autoComplete: "new-password" },
  { key: "name", label: "이름", type: "text", placeholder: "홍길동", autoComplete: "name" },
  { key: "phoneNumber", label: "전화번호", type: "tel", placeholder: "010-0000-0000", autoComplete: "tel" },
];

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
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative hidden overflow-hidden rounded-sm border-2 border-ink bg-surface p-10 shadow-stamp lg:flex lg:flex-col lg:justify-center"
      >
        <Mascot className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 -rotate-6" />
        <p className="relative mb-3 text-sm font-bold uppercase tracking-widest text-brand">Early Bird</p>
        <h1 className="relative font-display text-3xl font-bold leading-tight text-ink">
          가장 먼저 발견하는 사람이 되어보세요
        </h1>
        <p className="relative mt-4 max-w-sm text-mist">
          가입하고 아직 세상에 나오지 않은 프로젝트를 누구보다 먼저 만나보세요.
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
          <h2 className="mb-1 font-display text-2xl font-bold text-ink">회원가입</h2>
          <p className="mb-6 text-sm text-mist">몇 가지 정보만 입력하면 바로 시작할 수 있어요.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label htmlFor={`signup-${field.key}`} className="text-sm font-semibold text-ink">
                  {field.label}
                </label>
                <input
                  id={`signup-${field.key}`}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={handleChange(field.key)}
                  className="rounded-sm border-2 border-ink/25 bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
                  required
                />
              </div>
            ))}

            <Button type="submit" disabled={signupMutation.isPending} className="mt-2 w-full">
              {signupMutation.isPending ? "가입 중..." : "회원가입"}
            </Button>

            {signupMutation.isError && (
              <ErrorState error={{ message: "회원가입에 실패했습니다.", errors: null }} />
            )}
          </form>

          <p className="mt-6 text-sm text-mist">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="font-semibold text-brand underline underline-offset-2">
              로그인
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
