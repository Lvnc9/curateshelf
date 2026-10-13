"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { loginSchema, type LoginValues } from "@/lib/schemas";
import { AuthShell, FormError } from "@/components/AuthShell";
import { Form } from "@/components/shadcn/form";
import { Button } from "@/components/ui/primitives";
import { TextFormField, applyServerErrors } from "@/components/ui/FormFields";

// Seeded demo reader (see backend seed_demo), offered as a one-click fill for the portfolio demo.
const DEMO = { email: "reader@curateshelf.local", password: "reader12345" };

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [rootError, setRootError] = useState<string | null>(null);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { isSubmitting } = form.formState;

  async function onSubmit(values: LoginValues) {
    setRootError(null);
    try {
      await login(values.email, values.password);
      toast.success("Welcome back", { description: "Your shelf is where you left it." });
      // Only follow same-site relative paths.
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (err) {
      setRootError(applyServerErrors(err, form.setError, ["email", "password"]));
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title={
        <>
          Sign <span className="font-display-italic">in</span>
        </>
      }
      lede="Return to your shelf of loves and curiosities."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="border-b border-ink/40 text-ink hover:border-ink">
            Create an account
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
          <TextFormField control={form.control} name="email" label="Email" type="email" autoComplete="email" />
          <TextFormField control={form.control} name="password" label="Password" type="password" autoComplete="current-password" />
          <FormError message={rootError} />
          <div className="flex flex-wrap items-center gap-6">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => {
                form.setValue("email", DEMO.email, { shouldValidate: true });
                form.setValue("password", DEMO.password, { shouldValidate: true });
              }}
              className="border-b border-ink/30 pb-0.5 text-[0.72rem] uppercase tracking-[0.2em] text-ink-soft hover:border-ink"
            >
              Use demo reader
            </button>
          </div>
        </form>
      </Form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
