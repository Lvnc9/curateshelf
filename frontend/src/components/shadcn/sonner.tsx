"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={(resolvedTheme ?? "light") as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          // CurateShelf palette (see globals.css): paper card, ink text, hairline border
          "--normal-bg": "var(--paper)",
          "--normal-text": "var(--ink)",
          "--normal-border": "var(--hairline)",
          "--border-radius": "2px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "font-sans font-light shadow-[0_12px_40px_-12px_rgb(0_0_0/0.25)]",
          title: "text-[0.95rem] font-normal",
          description: "text-muted",
          actionButton: "!bg-ink !text-paper !rounded-none !text-[0.68rem] !uppercase !tracking-[0.18em]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
