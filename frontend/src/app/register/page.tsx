"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { registerSchema, type RegisterValues } from "@/lib/schemas";
import { AuthShell, FormError } from "@/components/AuthShell";
import { Form } from "@/components/shadcn/form";
import { Button } from "@/components/ui/primitives";
import { TextFormField, applyServerErrors } from "@/components/ui/FormFields";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", username: "", password: "" },
    mode: "onTouched",
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(values: RegisterValues) {
    setRootError(null);
    try {
      await register(values.email, values.password, values.username || undefined);
      toast.success("Welcome to CurateShelf", { description: "Love or mark pieces curious to start your shelf." });
      router.push("/");
    } catch (err) {
      setRootError(applyServerErrors(err, form.setError, ["email", "username", "password"]));
    }
  }

  return (
    <AuthShell
      eyebrow="Join the readership"
      title={
        <>
          Start your <span className="font-display-italic">shelf</span>
        </>
      }
      lede="Keep the pieces you love, and the ones you're curious about, in one quiet place."
      footer={
        <>
          Already reading?{" "}
          <Link href="/login" className="border-b border-ink/40 text-ink hover:border-ink">
            Sign in
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
          <TextFormField control={form.control} name="email" label="Email" type="email" autoComplete="email" />
          <TextFormField
            control={form.control}
            name="username"
            label="Username (optional)"
            autoComplete="username"
            description="Your public shelf address: /u/your-name. Leave blank to use your email name."
          />
          <TextFormField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            description="At least 8 characters, not only numbers."
          />
          <FormError message={rootError} />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create account"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
