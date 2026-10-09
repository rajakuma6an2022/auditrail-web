import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthHeader } from "@/components/layout/auth-header";
import { VerifyClient } from "./verify-client";

export const metadata: Metadata = { title: "Signing in" };

export default function VerifyPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AuthHeader />
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-12 sm:items-center sm:pt-0">
        <div className="w-full max-w-100 rounded-lg border border-border bg-surface p-6 sm:p-8">
          <Suspense fallback={null}>
            <VerifyClient />
          </Suspense>
        </div>
      </main>
    </div>
  );
}