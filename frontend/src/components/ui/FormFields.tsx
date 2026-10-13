"use client";

import type { ComponentProps } from "react";
import type { Control, FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/shadcn/form";
import { Switch } from "@/components/shadcn/switch";

const inputClass =
  "block w-full border-0 border-b border-ink/25 bg-transparent px-0 py-2.5 text-lg font-light outline-none transition-colors placeholder:text-muted/60 focus:border-ink aria-[invalid=true]:border-danger";

/**
 * Editorial text field wired to react-hook-form via shadcn's <FormField>:
 * eyebrow label, underlined input, inline error (aria-invalid + aria-describedby come from FormControl).
 */
export function TextFormField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  multiline = false,
  ...inputProps
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  multiline?: boolean;
} & Omit<ComponentProps<"input">, "name"> & { rows?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-1.5">
          <FormLabel className="text-eyebrow font-normal uppercase text-muted">{label}</FormLabel>
          <FormControl>
            {multiline ? (
              <textarea
                {...field}
                value={field.value ?? ""}
                rows={inputProps.rows ?? 3}
                placeholder={inputProps.placeholder}
                className={`${inputClass} resize-y`}
              />
            ) : (
              <input {...inputProps} {...field} value={field.value ?? ""} className={inputClass} />
            )}
          </FormControl>
          {description && <FormDescription className="text-xs text-muted">{description}</FormDescription>}
          <FormMessage className="text-sm text-danger" />
        </FormItem>
      )}
    />
  );
}

/** Labelled switch row (e.g. email preferences) bound to a boolean form field. */
export function SwitchFormField<T extends FieldValues>({
  control,
  name,
  label,
  description,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between gap-6 border-b border-hairline py-4">
          <div className="grid gap-1">
            <FormLabel className="text-[0.95rem] font-normal">{label}</FormLabel>
            <FormDescription className="text-sm text-muted">{description}</FormDescription>
          </div>
          <FormControl>
            <Switch checked={!!field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-ink" />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

/**
 * Map a DRF error (thrown by lib/api request() as the raw response text) onto the form:
 * field errors go to their fields, `detail` / non_field_errors to the form root.
 * Returns the message to show at the form level, if any.
 */
export function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, fields: readonly string[]): string | null {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    let root: string | null = null;
    for (const [key, value] of Object.entries(parsed)) {
      const msg = Array.isArray(value) ? value.join(" ") : String(value);
      if (fields.includes(key)) setError(key as FieldPath<T>, { type: "server", message: msg });
      else root = root ? `${root} ${msg}` : msg;
    }
    return root;
  } catch {
    return raw.slice(0, 200) || "Something went wrong.";
  }
}
