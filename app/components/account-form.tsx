"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";
import { useCart } from "./cart-context";

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
    <main className={`account-page grid min-h-[70vh] place-items-center bg-[#e8eee9] p-[54px_20px]`}>
      <section className={`account-card w-[min(100%,_480px)] border border-[#d1ddd2] bg-[#fafaf8] p-[clamp(26px,_6vw,_52px)] shadow-sm [&_h1]:m-[14px_0_10px] [&_h1]:font-serif [&_h1]:text-[clamp(38px,_6vw,_54px)] [&_h1]:font-normal [&_h1]:tracking-[-2px] [&_h1]:leading-none [&_h1]:text-[#233b30]`}>
        <p className={`eyebrow m-0 text-[#52715d] text-[11px] font-bold tracking-[1.5px]`}>FORM & FUNCTION</p>
        <h1>{adminOnly ? "Administrator sign in." : deliveryOnly ? "Delivery team sign in." : isSignup ? "Create your account." : "Welcome back."}</h1>
        <p className={`account-intro mb-[27px] text-[15px] leading-[1.6] text-[#536157]`}>
          {adminOnly
            ? "Sign in with your administrator account to continue."
            : deliveryOnly
            ? "Sign in to view orders and update their delivery status."
            : isSignup
            ? "Save your favorites and make your routine yours."
            : "Log in to revisit your everyday essentials."}
        </p>
        <form className={`checkout-form grid gap-[15px] [&_label]:grid [&_label]:gap-[7px] [&_label]:text-[#3f5848] [&_label]:text-xs [&_label]:font-semibold [&_input]:w-full [&_input]:h-[44px] [&_input]:p-[0_12px] [&_input]:border [&_input]:border-[#cbd6cc] [&_input]:rounded-none [&_input]:outline-none [&_input]:bg-white [&_input]:text-[var(--ink)] [&_input]:text-sm [&_input:focus]:border-[#355342] [&_input:focus]:shadow-[0_0_0_2px_rgb(53_83_66_/_12%)]`} onSubmit={submit}>
          {isSignup && (
            <label>
              Full name
              <input name="name" autoComplete="name" placeholder="Your name" required />
            </label>
          )}
          <label>
            Email address
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={8}
              placeholder="At least 8 characters"
              required
            />
          </label>
          <button className={`button button-dark account-submit mt-[5px] min-h-[48px] inline-flex w-full items-center justify-center gap-7 border-0 bg-[#355342] p-[0_20px] text-sm font-semibold text-white transition-[background_160ms_ease,_transform_160ms_ease] [&:hover]:-translate-y-px [&:hover]:bg-[#233b30] disabled:cursor-not-allowed disabled:opacity-60`} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait…" : isSignup ? "Create account" : "Log in"}
          </button>
        </form>
        {errorMessage && (
          <p className={`account-notice m-[18px_0_0] bg-red-50 p-3 text-[15px] leading-[1.6] text-red-800`} role="alert">
            {errorMessage}
          </p>
        )}
        {sessionExpired && (
          <p className="account-notice mt-4 bg-[#edf1eb] p-3 text-[15px] leading-[1.6] text-[#355342]" role="status">
            Your session expired. Sign in again to continue.
          </p>
        )}
        <p className={`account-switch m-[22px_0_0] text-center text-[15px] leading-[1.6] text-[#536157] [&_a]:font-bold [&_a]:text-[#355342] [&_a]:underline [&_a]:underline-offset-3`}>
          {adminOnly || deliveryOnly ? (
            <Link href="/login">Customer sign in</Link>
          ) : (
            <>
              {isSignup ? "Already have an account?" : "New to Form & Function?"}{" "}
              <Link href={isSignup ? "/login" : "/signup"}>
                {isSignup ? "Log in" : "Sign up"}
              </Link>
              {!isSignup && (
                <>
                  {" · "}
                  <Link href="/admin/login">Administrator sign in</Link>
                  {" · "}
                  <Link href="/delivery/login">Delivery team sign in</Link>
                </>
              )}
            </>
          )}
        </p>
      </section>
    </main>
  );
}
