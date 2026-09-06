"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-medium">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message && error.message !== "An error occurred in the Server Components render."
          ? error.message
          : "Please try again, or go back and check the details you entered."}
      </p>
      {error.digest && <p className="mt-1 text-xs text-muted-foreground/70">Reference: {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:shadow-md"
      >
        Try again
      </button>
    </main>
  );
}
