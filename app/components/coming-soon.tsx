import Image from "next/image";

export function ComingSoon() {
  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-[#F3E8FF] px-5 py-12 max-[600px]:px-4">
      <section className="relative grid w-[min(100%,760px)] justify-items-center overflow-hidden rounded-[2rem] border border-white/80 bg-white px-8 py-12 text-center shadow-[0_24px_80px_-32px_rgba(76,29,149,0.28)] sm:px-14 sm:py-16">
        <span
          aria-hidden="true"
          className="absolute -right-20 -top-24 size-64 rounded-full bg-[#E6F7E1] blur-3xl"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-28 -left-20 size-64 rounded-full bg-[#F3E8FF] blur-3xl"
        />
        <Image
          alt="VitaHub UG — Grow well, together"
          className="relative z-10 h-auto w-[min(100%,360px)]"
          height={1024}
          priority
          src="/logo.png"
          width={1536}
        />
        <p className="relative z-10 mb-3 mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#6D28D9]">
          Coming soon
        </p>
        <h1 className="relative z-10 m-0 max-w-xl text-[clamp(34px,6vw,58px)] font-medium leading-[1.05] tracking-[-0.04em] text-[#2E1065]">
          A little more wellness is on its way.
        </h1>
        <p className="relative z-10 mb-0 mt-5 max-w-md text-[15px] leading-7 text-[#6B6680]">
          We&apos;re getting VitaHub UG ready. Check back soon and grow well,
          together.
        </p>
        <span
          aria-hidden="true"
          className="relative z-10 mt-9 h-1 w-16 rounded-full bg-[#20A800]"
        />
      </section>
    </main>
  );
}
