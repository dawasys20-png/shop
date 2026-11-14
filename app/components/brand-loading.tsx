import Image from "next/image";

export function BrandLoading() {
  return (
    <main
      className="mx-auto flex min-h-[65vh] w-[min(100%_-_32px,_1440px)] flex-col items-center justify-center gap-3"
      role="status"
      aria-label="Loading page"
    >
      <Image
        src="/logo.png"
        alt="VitaHub UG"
        width={160}
        height={160}
        className="h-40 w-40 animate-pulse object-contain"
      />
      <span className="sr-only">Loading page...</span>
    </main>
  );
}
