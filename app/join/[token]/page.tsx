import { joinGroupByToken } from "@/app/actions/groups";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await joinGroupByToken(token);

  if (result?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-zinc-900">Invalid invite link</h1>
          <p className="text-zinc-500 text-sm">This link may have expired or been revoked.</p>
        </div>
      </div>
    );
  }

  return null;
}
