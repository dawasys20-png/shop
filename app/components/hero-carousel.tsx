"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FocusEvent } from "react";

/*
  Palette under test
  primary #6D28D9, dark #4C1D95, light #F3E8FF, green #20A800, background #FAFAFA
  The image overlay uses a deeper purple (#2E1065) so white text stays readable.
*/

const slides = [
  {
    eyebrow: "Wellness, without the noise",
    title: (
      <>
        Feel good.
        <br />
        Live well.
      </>
    ),
    description:
      "Thoughtfully chosen supplements for your everyday routine. Quality ingredients, purposeful choices, and wellness that works with your lifestyle.",
    cta: "Explore the collection",
    href: "/shop",
  },
  {
    eyebrow: "Build a routine that sticks",
    title: (
      <>
        Small steps.
        <br />
        Better days.
      </>
    ),
    description:
      "Start with the basics and find everyday essentials that fit your own rhythm.",
    cta: "Shop all supplements",
    href: "/shop",
  },
  {
    eyebrow: "Find your fit",
    title: (
      <>
        Your wellness.
        <br />
        Your way.
      </>
    ),
    description:
      "Explore thoughtful essentials for your everyday routine, all in one place.",
    cta: "Browse the shop",
    href: "/shop",
  },
];

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === "left" ? (
        <path d="M19 12H5m7 7-7-7 7-7" />
      ) : (
        <path d="M5 12h14m-7-7 7 7-7 7" />
      )}
    </svg>
  );
}

export function HeroCarousel({ images }: { images: string[] }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (
      isPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  function pauseOnFocusExit(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsPaused(false);
    }
  }

  function showPreviousSlide() {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  }

  function showNextSlide() {
    setActiveSlide((current) => (current + 1) % slides.length);
  }

  return (
    <section
      className="relative flex min-h-[460px] items-center overflow-hidden rounded-3xl bg-[#4C1D95] px-8 text-white max-[600px]:min-h-[420px] max-[600px]:px-6 lg:px-16"
      aria-label="Featured wellness highlights"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={pauseOnFocusExit}
    >
      <div className="absolute inset-0" aria-hidden="true">
        {slides.map((slide, index) => (
          <div
            className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
              index === activeSlide ? "opacity-100" : "opacity-0"
            }`}
            key={slide.eyebrow}
          >
            <Image
              src={images[index] || "/hero.png"}
              alt=""
              fill
              priority={index === 0}
              sizes="(max-width: 600px) calc(100vw - 32px), (max-width: 900px) calc(100vw - 56px), 1440px"
              className="object-cover object-center"
              unoptimized
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(46,16,101,0.86),rgba(46,16,101,0.52),rgba(46,16,101,0.1))]" />
        <div className="absolute inset-0 bg-[#2E1065]/35 sm:hidden" />
      </div>

      <div className="relative z-10 w-full overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <article
              className="w-full shrink-0 py-14 text-left"
              key={slide.eyebrow}
              aria-hidden={index !== activeSlide}
              inert={index !== activeSlide}
            >
              <div className="max-w-[620px]">
                <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-[13px] text-white backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#20A800]" />
                  {slide.eyebrow}
                </p>
                <h1 className="mb-5 mt-0 text-[clamp(44px,7vw,76px)] font-medium leading-[1.04] tracking-[-0.03em] text-white">
                  {slide.title}
                </h1>
                <p className="mb-8 mt-0 max-w-[420px] text-base leading-7 text-[#EDE4FA]">
                  {slide.description}
                </p>
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-4 rounded-full bg-[#20A800] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#2FC106] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  href={slide.href}
                  tabIndex={index === activeSlide ? undefined : -1}
                >
                  {slide.cta} <ArrowIcon direction="right" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 right-7 z-20 flex items-center gap-3 max-[600px]:bottom-4 max-[600px]:right-4">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/60 bg-black/15 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={showPreviousSlide}
          aria-label="Show previous slide"
        >
          <ArrowIcon direction="left" />
        </button>
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label="Choose a slide"
        >
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.eyebrow}
              className={`h-2.5 rounded-full transition-all ${
                index === activeSlide
                  ? "w-6 bg-white"
                  : "w-2.5 bg-white/60 hover:bg-white"
              }`}
              onClick={() => setActiveSlide(index)}
              aria-label={`Show slide ${index + 1}: ${slide.eyebrow}`}
              aria-current={index === activeSlide ? "true" : undefined}
            />
          ))}
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/60 bg-black/15 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={showNextSlide}
          aria-label="Show next slide"
        >
          <ArrowIcon direction="right" />
        </button>
      </div>
    </section>
  );
}