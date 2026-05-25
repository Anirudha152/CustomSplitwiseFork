import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 text-white text-2xl font-bold mb-2">
            S
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
            Splitwise
          </h1>
          <p className="text-zinc-500 text-lg leading-relaxed">
            Split expenses with friends and groups. Keep track of who owes
            what, settle up easily.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/signin"
            className="flex items-center justify-center w-full h-12 rounded-xl bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-800 transition-colors"
          >
            Get started — it&apos;s free
          </Link>
          <p className="text-xs text-zinc-400">
            Sign in with Google or email.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { label: "Split equally", icon: "⚖️" },
            { label: "Track debts", icon: "📋" },
            { label: "Settle up", icon: "✅" },
          ].map((f) => (
            <div key={f.label} className="bg-white rounded-xl p-4 border border-zinc-100 space-y-2">
              <div className="text-2xl">{f.icon}</div>
              <div className="text-xs font-medium text-zinc-600">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
