import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SignInTabs } from "@/components/signin-tabs";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/app");

  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/app";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-zinc-100 p-8 shadow-sm">
        <div className="text-center space-y-1 mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 text-white font-bold text-lg mb-3">
            S
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Splitwise</h1>
          <p className="text-sm text-zinc-500">
            Sign in or create an account to continue
          </p>
        </div>
        <SignInTabs callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
