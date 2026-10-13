"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { settingsSchema, type SettingsValues } from "@/lib/schemas";
import { Form } from "@/components/shadcn/form";
import { Button, Eyebrow } from "@/components/ui/primitives";
import { SwitchFormField, TextFormField, applyServerErrors } from "@/components/ui/FormFields";

const EMPTY: SettingsValues = {
  display_name: "",
  bio: "",
  location: "",
  website: "",
  notify_replies: true,
  notify_digest: true,
};

export default function SettingsPage() {
  const { user, refresh, loading } = useAuth();
  const router = useRouter();
  const form = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema), defaultValues: EMPTY, mode: "onTouched" });
  const { isSubmitting, isDirty } = form.formState;

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/settings");
    if (user) {
      form.reset({
        display_name: user.display_name || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        notify_replies: user.notify_replies ?? true,
        notify_digest: user.notify_digest ?? true,
      });
    }
  }, [user, loading, router, form]);

  async function onSubmit(values: SettingsValues) {
    try {
      await api.updateMe(values);
      await refresh();
      toast.success("Settings saved");
    } catch (err) {
      const root = applyServerErrors(err, form.setError, Object.keys(EMPTY));
      toast.error("Couldn't save settings", { description: root ?? "Check the highlighted fields." });
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto grid max-w-[90rem] gap-12 px-5 pb-28 pt-28 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:px-10 md:pt-36">
      <div>
        <Eyebrow>Your account</Eyebrow>
        <h1 className="mt-4 text-display">Settings</h1>
        <p className="mt-5 max-w-sm text-lede text-muted">How you appear to other readers, and what we send you.</p>
        <Link
          href={`/u/${user.username}`}
          className="mt-8 inline-block border-b border-ink/30 pb-1 text-[0.72rem] uppercase tracking-[0.22em] hover:border-ink"
        >
          View your shelf
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-9 md:pt-4" noValidate>
          <section className="space-y-9" aria-labelledby="profile-heading">
            <h2 id="profile-heading" className="text-eyebrow uppercase text-muted">Public profile</h2>
            <TextFormField control={form.control} name="display_name" label="Display name" autoComplete="name" />
            <TextFormField control={form.control} name="bio" label="Bio" multiline rows={3} placeholder="A line about what you collect" />
            <div className="grid gap-9 sm:grid-cols-2">
              <TextFormField control={form.control} name="location" label="Location" />
              <TextFormField control={form.control} name="website" label="Website" type="url" placeholder="https://" />
            </div>
          </section>

          <section aria-labelledby="email-heading">
            <h2 id="email-heading" className="text-eyebrow uppercase text-muted">Email</h2>
            <div className="mt-2 border-t border-hairline">
              <SwitchFormField
                control={form.control}
                name="notify_replies"
                label="Replies to my notes"
                description="An email when someone replies to you in a conversation."
              />
              <SwitchFormField
                control={form.control}
                name="notify_digest"
                label="Weekly editorial digest"
                description="Monday morning: the five pieces readers responded to most."
              />
            </div>
          </section>

          <div className="flex items-center gap-6">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
            {isDirty && <p className="text-sm text-muted">Unsaved changes</p>}
          </div>
        </form>
      </Form>
    </div>
  );
}
