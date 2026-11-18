"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { apiRequest } from "../lib/api";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]";

const labelClass = "grid gap-2 text-[13px] font-semibold text-[#4C1D95]";

const inputClass =
  "h-12 w-full min-w-0 rounded-xl border border-[#E0D6F2] bg-white px-4 text-sm font-normal text-[#1F1B2E] outline-none transition-[border-color,box-shadow] placeholder:text-[#9A94AE] focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.15)]";

const linkClass = `font-semibold text-[#6D28D9] underline underline-offset-4 transition-colors hover:text-[#4C1D95] ${focusRing}`;

function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-[#F3E8FF] px-5 py-14 max-[600px]:px-4 max-[600px]:py-10">
      <section className="w-[min(100%,480px)] rounded-3xl border border-[#E9E1F5] bg-white p-[clamp(26px,6vw,48px)] shadow-[0_12px_40px_-16px_rgba(76,29,149,0.25)]">
        <h1 className="m-0 mb-3 text-[clamp(32px,5vw,42px)] font-medium leading-[1.1] tracking-[-0.025em] text-[#4C1D95]">
          {title}
        </h1>
        <p className="mb-7 mt-0 text-[15px] leading-6 text-[#6B6680]">
          {description}
        </p>
        {children}
      </section>
    </main>
  );
}

function FormMessage({
  message,
  tone,
}: {
  message: string;
  tone: "error" | "success";
}) {
  if (!message) return null;

  return (
    <p
      className={`mb-0 mt-5 rounded-2xl border px-4 py-3 text-sm leading-6 ${
        tone === "error"
          ? "border-[#F0D3CF] bg-[#FBEFED] text-[#9A443E]"
          : "border-[#CDEBC4] bg-[#E6F7E1] text-[#14530A]"
      }`}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await apiRequest<{ message: string }>(
        "/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            email: String(formData.get("email") ?? "").trim(),
          }),
        },
      );
      setMessage(response.message);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not process your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Forgot your password?"
      description="Enter the email address for your account. If it’s registered, we’ll send you a link to reset your password."
    >
      <form className="grid gap-5" onSubmit={submit}>
        <label className={labelClass}>
          Email address
          <input
            className={inputClass}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={254}
            required
          />
        </label>
        <button
          className={`mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#20A800] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2FC106] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Please wait…" : "Send reset link"}
        </button>
      </form>
      <FormMessage message={errorMessage} tone="error" />
      <FormMessage message={message} tone="success" />
      <p className="mb-0 mt-7 border-t border-[#E9E1F5] pt-6 text-center text-sm">
        <Link className={linkClass} href="/login">
          Back to sign in
        </Link>
      </p>
    </PageShell>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmPassword") ?? "");
    if (password !== confirmation) {
      setErrorMessage("The passwords do not match.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setErrorMessage("Password must be no more than 72 bytes.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest<{ message: string }>(
        "/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({ token, newPassword: password }),
        },
      );
      setMessage(response.message);
      setIsComplete(true);
      form.reset();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not reset your password. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Reset your password."
      description={
        token
          ? "Choose a new password for your account."
          : "This reset link is incomplete. Request a new one to continue."
      }
    >
      {token && !isComplete ? (
        <form className="grid gap-5" onSubmit={submit}>
          <label className={labelClass}>
            New password
            <input
              className={inputClass}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              placeholder="At least 8 characters"
              required
            />
          </label>
          <label className={labelClass}>
            Confirm new password
            <input
              className={inputClass}
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              placeholder="Enter your new password again"
              required
            />
          </label>
          <button
            className={`mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#20A800] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2FC106] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Please wait…" : "Save new password"}
          </button>
        </form>
      ) : null}
      <FormMessage message={errorMessage} tone="error" />
      <FormMessage message={message} tone="success" />
      {(isComplete || !token) && (
        <p className="mb-0 mt-7 text-center text-sm">
          {isComplete ? (
            <Link className={linkClass} href="/login">
              Sign in with your new password
            </Link>
          ) : (
            <Link className={linkClass} href="/forgot-password">
              Request a new reset link
            </Link>
          )}
        </p>
      )}
      {!isComplete && token && (
        <p className="mb-0 mt-7 border-t border-[#E9E1F5] pt-6 text-center text-sm">
          <Link className={linkClass} href="/login">
            Back to sign in
          </Link>
        </p>
      )}
    </PageShell>
  );
}
