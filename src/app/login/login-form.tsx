"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestMagicLink } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";

const emailSchema = z.email({ error: "Enter a valid email address." });

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter your email address.";
  const result = emailSchema.safeParse(trimmed);
  return result.success ? null : (result.error.issues[0]?.message ?? "Enter a valid email address.");
}

type Status = "idle" | "loading" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("We couldn't send the sign-in link. Please try again in a moment.");
  const inputRef = useRef<HTMLInputElement>(null);
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === "sent") sentHeadingRef.current?.focus();
  }, [status]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const error = validateEmail(email);
    setFieldError(error);
    if (error) {
      inputRef.current?.focus();
      return;
    }
    setStatus("loading");
    try {
      await requestMagicLink(email.trim());
      setStatus("sent");
    } catch (e) {
      setErrorMessage(
        e instanceof ApiError && e.status === 429
          ? "Too many attempts. Please wait a few minutes and try again."
          : "We couldn't send the sign-in link. Please try again in a moment.",
      );
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col gap-4" role="status">
        <div className="flex size-9 items-center justify-center rounded-md bg-success-soft text-success">
          <svg
            className="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5">
          <h1
            ref={sentHeadingRef}
            tabIndex={-1}
            className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
          >
            Check your email
          </h1>
          <p className="text-sm text-fg-secondary">
            If <span className="font-mono text-fg">{email.trim()}</span> is registered, a sign-in link is on its way. It
            expires in 15 minutes.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setStatus("idle");
            setEmail("");
          }}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight">Sign in to Auditrail</h1>
        <p className="text-sm text-fg-secondary">Investigate application events and audit activity.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {status === "error" && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-error/30 bg-error-soft p-3 text-sm text-error"
          >
            <svg className="mt-0.5 size-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm-.75 3.5h1.5v4h-1.5V5Zm0 5.25h1.5v1.5h-1.5v-1.5Z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <Input
          ref={inputRef}
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldError) setFieldError(null);
          }}
          error={fieldError}
          disabled={status === "loading"}
        />

        <Button type="submit" loading={status === "loading"} loadingText="Sending link…" className="w-full">
          Send magic link
        </Button>
      </form>

      <p className="text-xs text-fg-muted">We&apos;ll send a secure sign-in link to your email.</p>
    </div>
  );
}
