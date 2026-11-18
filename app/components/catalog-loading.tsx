import Image from "next/image";

export function CatalogLoading() {
  return (
    <main
      className="mx-auto min-h-[65vh] w-[min(100%_-_104px,_1440px)] pb-28 pt-8 max-[900px]:w-[calc(100%_-_56px)] max-[600px]:w-[calc(100%_-_32px)] max-[600px]:pt-5"
      role="status"
      aria-label="Loading products"
    >
      <div className="mb-6 h-4 w-40 rounded bg-[#F3E8FF]" aria-hidden="true" />
      <div className="mb-10 flex min-h-24 items-end justify-between gap-6 border-b border-[#E9E1F5] pb-8 max-[600px]:mb-6 max-[600px]:pb-6">
        <div className="grid gap-3">
          <div
            className="h-10 w-64 max-w-[70vw] rounded bg-[#F3E8FF]"
            aria-hidden="true"
          />
          <div className="h-4 w-56 max-w-[60vw] rounded bg-[#F3E8FF]" aria-hidden="true" />
        </div>
      </div>

      <div className="grid grid-cols-[250px_minmax(0,1fr)] items-start gap-14 max-[1100px]:gap-10 max-[900px]:grid-cols-[210px_minmax(0,1fr)] max-[900px]:gap-7 max-[600px]:grid-cols-1 max-[600px]:gap-5">
        <aside
          className="grid gap-7 max-[600px]:hidden"
          aria-label="Product filters loading"
          aria-hidden="true"
        >
          <div className="grid gap-3">
            <div className="h-4 w-24 rounded bg-[#F3E8FF]" />
            <div className="grid gap-2">
              <div className="h-8 rounded bg-[#F3E8FF]" />
              <div className="h-8 rounded bg-[#F3E8FF]" />
              <div className="h-8 rounded bg-[#F3E8FF]" />
            </div>
          </div>
          <div className="grid gap-3 border-t border-[#E9E1F5] pt-6">
            <div className="h-4 w-16 rounded bg-[#F3E8FF]" />
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-full bg-[#F3E8FF]" />
              <div className="h-8 w-20 rounded-full bg-[#F3E8FF]" />
            </div>
          </div>
          <div className="grid gap-3 border-t border-[#E9E1F5] pt-6">
            <div className="h-4 w-32 rounded bg-[#F3E8FF]" />
            <div className="h-1 rounded-full bg-[#F3E8FF]" />
          </div>
        </aside>

        <div className="flex min-h-[380px] items-center justify-center">
          <Image
            src="/logo.png"
            alt=""
            width={160}
            height={160}
            className="h-40 w-40 animate-pulse object-contain"
          />
        </div>
      </div>
      <span className="sr-only">Loading products...</span>
    </main>
  );
}
