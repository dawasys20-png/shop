"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";
import { useCart } from "./cart-context";

/*
  Palette under test
  primary #6D28D9, dark #4C1D95, light #F3E8FF, green #20A800, background #FAFAFA
  Green is used for the submit button, with dark text (#0B1F05): white on this
  green is too low contrast for small text.
  neutrals: body #4A4658, muted #6B6680, control border #E0D6F2
*/

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]";

const labelClass = "grid gap-2 text-[13px] font-semibold text-[#4C1D95]";

const inputClass =
  "h-12 w-full min-w-0 rounded-xl border border-[#E0D6F2] bg-white px-4 text-sm font-normal text-[#1F1B2E] outline-none transition-[border-color,box-shadow] placeholder:text-[#9A94AE] focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.15)]";

const linkClass = `font-semibold text-[#6D28D9] underline underline-offset-4 transition-colors hover:text-[#4C1D95] ${focusRing}`;

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getSessionExpiredSnapshot() {
  return new URLSearchParams(window.location.search).get("session") === "expired";
}

export function AccountForm({
  mode,
  adminOnly = false,
  deliveryOnly = false,
}: {
  mode: "login" | "signup";
  adminOnly?: boolean;
  deliveryOnly?: boolean;
}) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sessionExpired = useSyncExternalStore(
    subscribeToLocation,
    getSessionExpiredSnapshot,
    () => false,
  );
  const router = useRouter();
  const { refreshOrders } = useCart();
  const isSignup = !adminOnly && !deliveryOnly && mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const body = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    };
    try {
      const { user } = await apiRequest<{
        user: { role: "admin" | "customer" | "delivery" };
      }>(isSignup ? "/auth/signup" : adminOnly ? "/auth/admin/login" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (adminOnly && user.role !== "admin") {
        await apiRequest<void>("/auth/logout", { method: "POST" });
        throw new Error("Administrator access is required.");
      }
      if (deliveryOnly && user.role !== "delivery") {
        await apiRequest<void>("/auth/logout", { method: "POST" });
        throw new Error("Delivery team access is required.");
      }
      window.dispatchEvent(new Event("auth-state-changed"));
      if (!adminOnly) {
        try {
          await refreshOrders();
        } catch (error) {
          console.error("Could not refresh account orders after sign-in.", error);
        }
      }
      const requestedPath = new URLSearchParams(window.location.search).get("returnTo");
      const safeReturnPath =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : null;
      const destination = adminOnly
        ? safeReturnPath?.startsWith("/admin")
          ? safeReturnPath
          : "/admin"
        : deliveryOnly
          ? "/delivery"
          : user.role === "admin"
            ? "/admin"
            : user.role === "delivery"
              ? "/delivery"
              : safeReturnPath || "/orders";
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Authentication could not be completed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-[70vh] place-items-center bg-[#F3E8FF] px-5 py-14 max-[600px]:px-4 max-[600px]:py-10">
      <section className="w-[min(100%,480px)] rounded-3xl border border-[#E9E1F5] bg-white p-[clamp(26px,6vw,48px)] shadow-[0_12px_40px_-16px_rgba(76,29,149,0.25)]">
        <h1 className="m-0 mb-3 text-[clamp(32px,5vw,42px)] font-medium leading-[1.1] tracking-[-0.025em] text-[#4C1D95]">
          {adminOnly ? "Administrator sign in." : deliveryOnly ? "Delivery team sign in." : isSignup ? "Create your account." : "Welcome back."}
        </h1>
        <p className="mb-7 mt-0 text-[15px] leading-6 text-[#6B6680]">
          {adminOnly
            ? "Sign in with your administrator account to continue."
            : deliveryOnly
            ? "Sign in to view orders and update their delivery status."
            : isSignup
            ? "Save your favorites and make your routine yours."
            : "Log in to revisit your everyday essentials."}
        </p>

        <form className="grid gap-5" onSubmit={submit}>
          {isSignup && (
            <label className={labelClass}>
              Full name
              <input
                className={inputClass}
                name="name"
                autoComplete="name"
                placeholder="Your name"
                required
              />
            </label>
          )}
          <label className={labelClass}>
            Email address
            <input
              className={inputClass}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>
          <label className={labelClass}>
            Password
            <input
              className={inputClass}
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={8}
              placeholder="At least 8 characters"
              required
            />
          </label>
          <button
            className={`mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#20A800] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2FC106] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Please wait…" : isSignup ? "Create account" : "Log in"}
          </button>
        </form>

        {errorMessage && (
          <p
            className="mb-0 mt-5 rounded-2xl border border-[#F0D3CF] bg-[#FBEFED] px-4 py-3 text-sm leading-6 text-[#9A443E]"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
        {sessionExpired && (
          <p
            className="mb-0 mt-4 rounded-2xl bg-[#F3E8FF] px-4 py-3 text-sm leading-6 text-[#4C1D95]"
            role="status"
          >
            Your session expired. Sign in again to continue.
          </p>
        )}

        <p className="mb-0 mt-7 border-t border-[#E9E1F5] pt-6 text-center text-sm leading-7 text-[#6B6680]">
          {adminOnly || deliveryOnly ? (
            <Link className={linkClass} href="/login">
              Customer sign in
            </Link>
          ) : (
            <>
              {isSignup ? "Already have an account?" : "New to Vitahub Ug?"}{" "}
              <Link className={linkClass} href={isSignup ? "/login" : "/signup"}>
                {isSignup ? "Log in" : "Sign up"}
              </Link>
              {!isSignup && (
                <>
                  {" · "}
                  <Link className={linkClass} href="/forgot-password">
                    Forgot password?
                  </Link>
                  {" · "}
                  <Link className={linkClass} href="/admin/login">
                    Administrator sign in
                  </Link>
                  {" · "}
                  <Link className={linkClass} href="/delivery/login">
                    Delivery team sign in
                  </Link>
                </>
              )}
            </>
          )}
        </p>
      </section>
    </main>
  );
}