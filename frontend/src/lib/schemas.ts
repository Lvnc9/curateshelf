import { z } from "zod";

/** Client-side validation for account forms (react-hook-form + zodResolver). Mirrors the API rules. */

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.email("Enter a valid email address."),
  username: z
    .string()
    .max(50, "50 characters at most.")
    .regex(/^[a-zA-Z0-9_-]*$/, "Letters, numbers, dashes and underscores only."),
  // The API only enforces 8+; we also reject all-digit passwords (Django's NumericPasswordValidator).
  password: z
    .string()
    .min(8, "At least 8 characters.")
    .refine((v) => !/^\d+$/.test(v), "Can't be entirely numbers."),
});
export type RegisterValues = z.infer<typeof registerSchema>;

export const settingsSchema = z.object({
  display_name: z.string().max(120, "120 characters at most."),
  bio: z.string().max(600, "Keep it under 600 characters."),
  location: z.string().max(120, "120 characters at most."),
  website: z.union([z.literal(""), z.url("Enter a full URL, starting with https://")]),
  notify_replies: z.boolean(),
  notify_digest: z.boolean(),
});
export type SettingsValues = z.infer<typeof settingsSchema>;
