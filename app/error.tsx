"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[65vh] w-[min(100%_-_32px,_720px)] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-3xl font-medium text-[#233b30]">
        The store could not be loaded
      </h1>
      <p className="mt-3 max-w-lg text-[#6f7a70]">
        We could not get the latest store data from the backend. Please try again.
      </p>
      <button
        className="mt-6 min-h-11 rounded-full px-6 font-medium text-white bg-[#20A800] hover:bg-[#188C00]"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
