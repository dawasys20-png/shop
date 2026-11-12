"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { CategoryNavigation } from "./category-navigation";
import { useCart } from "./cart-context";
import { apiRequest } from "../lib/api";
import Image from "next/image";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#355342]";

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 8h14l1 12H4L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

export function StoreNavigation() {
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [signOutError, setSignOutError] = useState("");
  const sessionRequestId = useRef(0);
  const router = useRouter();
  const { itemCount, refreshOrders } = useCart();

  useEffect(() => {
    let active = true;
    function refreshUser() {
      const requestId = ++sessionRequestId.current;
      apiRequest<{ user: { name: string } | null }>("/auth/me")
        .then(({ user: currentUser }) => {
          if (active && requestId === sessionRequestId.current) {
            setUser(currentUser);
          }
        })
        .catch((error: unknown) => {
          if (active && requestId === sessionRequestId.current) {
            console.error("Could not check the current account session.", error);
          }
        });
    }

    refreshUser();
    window.addEventListener("auth-state-changed", refreshUser);
    return () => {
      active = false;
      window.removeEventListener("auth-state-changed", refreshUser);
    };
  }, []);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    router.push(
      `/shop${
        query.trim()
          ? `?query=${encodeURIComponent(query.trim())}`
          : ""
      }`,
    );
  }

  async function signOut() {
    setSignOutError("");
    try {
      await apiRequest<void>("/auth/logout", { method: "POST" });
      setUser(null);
      void refreshOrders().catch((error: unknown) => {
        console.error("Could not refresh orders after signing out.", error);
      });
      router.refresh();
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : "Could not sign out.",
      );
    }
  }

  return (
    <>
      {/* Announcement bar */}
      <div className="flex min-h-[34px] items-center justify-center gap-3 bg-[#edf1eb] px-4 py-2 text-[10px] tracking-[0.08em] text-[#355342] max-[600px]:gap-2 max-[600px]:text-[9px]">
        <span className="font-semibold uppercase">
          Good things, grown slowly.
        </span>

        <span className="h-3 w-px bg-[#b9c6b8]" />

        <span className="font-normal tracking-normal text-[#68776a]">
          Free shipping on orders UGX 150000+
        </span>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-30 border-b border-[#e3e7dd] bg-white/85 backdrop-blur-lg">
        <div className="mx-auto grid h-[76px] w-full max-w-[1600px] grid-cols-[1fr_minmax(300px,1.3fr)_1fr] items-center gap-8 px-[clamp(20px,4vw,60px)] max-[900px]:h-auto max-[900px]:grid-cols-[1fr_auto] max-[900px]:gap-x-4 max-[900px]:gap-y-3 max-[900px]:px-7 max-[900px]:py-3 max-[600px]:px-[18px]">
          {/* Brand */}
          <Link
            href="/"
            aria-label="Form and Function home"
            className={`group flex w-fit items-center gap-3 ${focusRing}`}
          >
            <Image src="/logo.png" height={100} width={100} className="" alt="vitahubug_logo" />
          </Link>

          {/* Navigation and search */}
          <div className="flex items-center justify-center gap-8 max-[900px]:col-span-2 max-[900px]:row-start-2 max-[900px]:justify-between">
            <Link
              href="/shop"
              className={`shrink-0 text-[14px] font-medium text-[#44524a] underline decoration-transparent decoration-2 underline-offset-[10px] transition-colors hover:text-[#233b30] hover:decoration-[#64806a] max-[900px]:hidden ${focusRing}`}
            >
              Shop all
            </Link>

            <form
              onSubmit={search}
              role="search"
              className="flex h-11 w-full max-w-[400px] items-center gap-2 rounded-full border border-transparent bg-[#f3f5ef] py-1 pl-5 pr-1 transition-[background-color,border-color,box-shadow] duration-200 focus-within:border-[#9db0a0] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(100,128,106,0.14)] max-[900px]:max-w-none"
            >
              <input
                type="search"
                aria-label="Search supplements"
                placeholder="Search supplements"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-[14px] text-[#233b30] outline-none placeholder:text-[#7d887f]"
              />

              <button
                type="submit"
                aria-label="Submit search"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#355342] text-white transition-colors hover:bg-[#233b30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#355342]"
              >
                <SearchIcon />
              </button>
            </form>
          </div>

          {/* Account and cart */}
          <div className="flex items-center justify-end gap-6 max-[900px]:col-start-2 max-[900px]:row-start-1 max-[900px]:gap-4">
            <div className="flex items-center gap-6 text-[14px] text-[#44524a] max-[900px]:hidden">
              {/* {user ? (
                <button
                  type="button"
                  onClick={signOut}
                  className={`transition-colors hover:text-[#233b30] ${focusRing}`}
                >
                  Sign out
                </button>
              ) : (
                <Link
                href="/login"
                className={`transition-colors hover:text-[#233b30] ${focusRing}`}
              >
                Log in
                </Link>
              )} */}

              <Link
                href="/orders"
                className={`transition-colors hover:text-[#233b30] ${focusRing}`}
              >
                Orders
              </Link>
            </div>

            {/* {!user && <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#355342] px-5 text-[13px] font-semibold text-[#355342] transition-colors hover:bg-[#355342] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#355342] max-[900px]:hidden"
            >
              Log in
            </Link>} */}
            {!user ? (
              <Link
                href="/login"
                className={`inline-flex h-10 items-center justify-center rounded-full border border-[#355342] px-5 text-[13px] font-semibold text-[#355342] transition-colors hover:bg-[#355342] hover:text-white ${focusRing} max-[900px]:hidden`}
              >
                Sign in
              </Link>
            ) : (
              <button
                type="button"
                onClick={signOut}
                className={`inline-flex h-10 items-center justify-center rounded-full border border-[#355342] px-5 text-[13px] font-semibold text-[#355342] transition-colors hover:bg-[#355342] hover:text-white ${focusRing} max-[900px]:hidden`}
              >
                Sign out
              </button>
            )}

            <Link
              href="/cart"
              aria-label={`View shopping bag, ${itemCount} items`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#edf1eb] pl-4 pr-1.5 text-[#233b30] transition-colors hover:bg-[#e1e8de] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#355342] max-[600px]:pl-3.5"
            >
              <BagIcon />

              <span className="text-[14px] font-medium max-[600px]:hidden">
                Bag
              </span>

              <span
                className={`grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-[12px] font-semibold ${
                  itemCount > 0
                    ? "bg-[#355342] text-white"
                    : "bg-white text-[#6f7a70]"
                }`}
              >
                {itemCount}
              </span>
            </Link>
          </div>

          {/* Mobile account links */}
          <div className="col-span-2 hidden items-center justify-end gap-5 border-t border-[#e3e7dd] pt-3 text-[13px] text-[#536157] max-[900px]:flex">
            {user ? (
              <button type="button" onClick={signOut} className="hover:text-[#233b30]">
                Sign out
              </button>
            ) : <Link href="/login" className="hover:text-[#233b30]">
              Log in
            </Link>}

            <Link href="/orders" className="hover:text-[#233b30]">
              My orders
            </Link>

            {!user && <Link
              href="/signup"
              className="font-semibold text-[#355342] hover:text-[#233b30]"
            >
              Create account
            </Link>}
            {signOutError && <span role="alert" className="text-red-700">{signOutError}</span>}
          </div>
        </div>
      </header>

      {signOutError && (
        <p className="m-0 bg-red-50 px-4 py-2 text-center text-sm text-red-800" role="alert">
          {signOutError}
        </p>
      )}

      {/* Supplement categories */}
      <Suspense fallback={null}>
        <CategoryNavigation />
      </Suspense>
    </>
  );
}