import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Image
            src="/images/logo-wordmark.png"
            alt="Eco Cleaning Technologies"
            width={1694}
            height={260}
            className="h-7 w-auto"
          />
        </Link>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
