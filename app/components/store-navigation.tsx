"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { CategoryNavigation } from "./category-navigation";
import { useCart } from "./cart-context";
import { apiRequest } from "../lib/api";
import Image from "next/image";

/*
  Palette under test
  primary      #6D28D9
  dark         #4C1D95
  light        #F3E8FF  (hover/pressed: #E9D5FF)
  background   #FAFAFA
  green        #20A800  (accent; pair with dark text #0B1F05, white text is too low contrast)
  neutrals     text #4A4658, muted #6B6680, border #E9E1F5
*/

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6D28D9]";

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
      <div className="overflow-hidden bg-[#4C1D95]">
        <div className="announcement-marquee flex min-h-[34px] items-center whitespace-nowrap px-4 py-2 text-[10px] tracking-[0.08em] text-white max-[600px]:text-[9px]">
          <div className="announcement-track flex w-max items-center gap-3 max-[600px]:gap-2">
            <span className="font-semibold uppercase">Good things, grown slowly.</span>
            <span className="h-3 w-px bg-[#D8C5F5]" />
            <span className="rounded-full bg-[#20A800] px-3 py-0.5 font-semibold tracking-normal text-white">
              Free shipping on orders UGX 150000+
            </span>
            <span className="h-3 w-px bg-[#D8C5F5]" />
            <span className="font-semibold uppercase">Good things, grown slowly.</span>
            <span className="h-3 w-px bg-[#D8C5F5]" aria-hidden="true" />
            <span
              className="rounded-full bg-[#20A800] px-3 py-0.5 font-semibold tracking-normal text-white"
              aria-hidden="true"
            >
              Free shipping on orders UGX 150000+
            </span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-30 border-b border-[#E9E1F5] bg-[#FAFAFA]/85 backdrop-blur-lg">
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
              className={`shrink-0 text-[14px] font-medium text-[#4A4658] underline decoration-transparent decoration-2 underline-offset-[10px] transition-colors hover:text-[#4C1D95] hover:decoration-[#6D28D9] max-[900px]:hidden ${focusRing}`}
            >
              Shop all
            </Link>

            <form
              onSubmit={search}
              role="search"
              className="flex h-11 w-full max-w-[400px] items-center gap-2 rounded-full border border-[#F3E8FF] py-1 pl-5 pr-1 transition-[background-color,border-color,box-shadow] duration-200 focus-within:border-[#C4A5F5] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(109,40,217,0.14)] max-[900px]:max-w-none"
            >
              <input
                type="search"
                aria-label="Search supplements"
                placeholder="Search supplements"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-[14px] text-[#2E1065] outline-none placeholder:text-[#7C6A9E]"
              />

              <button
                type="submit"
                aria-label="Submit search"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#6D28D9] text-white transition-colors hover:bg-[#4C1D95] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]"
              >
                <SearchIcon />
              </button>
            </form>
          </div>

          {/* Account and cart */}
          <div className="flex items-center justify-end gap-6 max-[900px]:col-start-2 max-[900px]:row-start-1 max-[900px]:gap-4">
            <div className="flex items-center gap-6 text-[14px] text-[#4A4658] max-[900px]:hidden">
              <Link
                href="/orders"
                className={`transition-colors hover:text-[#4C1D95] ${focusRing}`}
              >
                Orders
              </Link>
            </div>

            {!user ? (
              <Link
                href="/login"
                className={`inline-flex h-10 items-center justify-center rounded-full border border-[#F3E8FF] px-5 text-[13px] font-normal text-[#4C1D95] transition-colors hover:bg-[#6D28D9] hover:text-white ${focusRing} max-[900px]:hidden`}
              >
                Sign in
              </Link>
            ) : (
              <button
                type="button"
                onClick={signOut}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#F3E8FF] px-5 text-[13px] font-semibold text-[#6D28D9] transition-colors hover:bg-[#6D28D9] hover:text-white ${focusRing} max-[900px]:hidden`}
              >
                <span className="h-2 w-2 rounded-full bg-[#20A800]" aria-hidden="true" />
                Sign out
              </button>
            )}

            <Link
              href="/cart"
              aria-label={`View shopping bag, ${itemCount} items`}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#F3E8FF] pl-4 pr-1.5 text-[#4C1D95] transition-colors hover:bg-[#E9D5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9] max-[600px]:pl-3.5"
            >
              <BagIcon />

              <span className="text-[14px] font-medium max-[600px]:hidden">
                Bag
              </span>

              <span
                className={`grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-[12px] font-semibold ${
                  itemCount > 0
                    ? "bg-[#20A800] text-white"
                    : "bg-white text-[#6B6680]"
                }`}
              >
                {itemCount}
              </span>
            </Link>
          </div>

          {/* Mobile account links */}
          <div className="col-span-2 hidden items-center justify-end gap-5 border-t border-[#E9E1F5] pt-3 text-[13px] text-[#4A4658] max-[900px]:flex">
            {user ? (
              <button type="button" onClick={signOut} className="hover:text-[#4C1D95]">
                Sign out
              </button>
            ) : <Link href="/login" className="hover:text-[#4C1D95]">
              Log in
            </Link>}

            <Link href="/orders" className="hover:text-[#4C1D95]">
              My orders
            </Link>

            {!user && <Link
              href="/signup"
              className="font-semibold text-[#6D28D9] hover:text-[#4C1D95]"
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