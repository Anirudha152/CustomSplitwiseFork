"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, Users, Activity, Plus } from "lucide-react";
import { useState } from "react";
import { CreateGroupDialog } from "@/components/create-group-dialog";

interface SidebarGroup {
  id: string;
  name: string;
  balance: number;
}

interface SidebarFriend {
  id: string;
  name: string | null;
  image: string | null;
  balance: number;
}

interface SidebarProps {
  groups: SidebarGroup[];
  friends: SidebarFriend[];
  currentUser: { id: string; name: string | null; image: string | null };
}

export function Sidebar({ groups, friends, currentUser }: SidebarProps) {
  const pathname = usePathname();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <aside className="w-64 shrink-0 border-r border-zinc-100 bg-white h-screen sticky top-0 flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-zinc-100">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
          <span className="font-semibold text-zinc-900">Splitwise</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main nav */}
          <div className="space-y-1">
            <NavLink href="/app" icon={<LayoutDashboard size={16} />} label="Dashboard" active={pathname === "/app"} />
            <NavLink href="/app/activity" icon={<Activity size={16} />} label="Activity" active={pathname === "/app/activity"} />
          </div>

          {/* Groups */}
          <div>
            <div className="flex items-center justify-between mb-1 px-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Groups</span>
              <button
                onClick={() => setShowCreate(true)}
                className="text-zinc-400 hover:text-zinc-700 transition-colors"
                title="New group"
              >
                <Plus size={14} />
              </button>
            </div>
            {groups.length === 0 ? (
              <p className="px-2 text-xs text-zinc-400 py-1">No groups yet</p>
            ) : (
              <div className="space-y-0.5">
                {groups.map((g) => (
                  <Link
                    key={g.id}
                    href={`/app/groups/${g.id}`}
                    className={cn(
                      "flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors",
                      pathname === `/app/groups/${g.id}`
                        ? "bg-zinc-100 text-zinc-900 font-medium"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    )}
                  >
                    <span className="truncate">{g.name}</span>
                    <BalancePill balance={g.balance} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Friends */}
          {friends.length > 0 && (
            <div>
              <div className="flex items-center mb-1 px-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Friends</span>
              </div>
              <div className="space-y-0.5">
                {friends.map((f) => (
                  <Link
                    key={f.id}
                    href={`/app/friends/${f.id}`}
                    className={cn(
                      "flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors",
                      pathname === `/app/friends/${f.id}`
                        ? "bg-zinc-100 text-zinc-900 font-medium"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={f.image ?? ""} />
                        <AvatarFallback className="text-[10px]">{f.name?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{f.name ?? f.id}</span>
                    </div>
                    <BalancePill balance={f.balance} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-zinc-100 px-3 py-3 flex items-center gap-2">
          <Avatar className="w-7 h-7">
            <AvatarImage src={currentUser.image ?? ""} />
            <AvatarFallback className="text-xs">{currentUser.name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-800 truncate">{currentUser.name}</p>
          </div>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <CreateGroupDialog open={showCreate} onOpenChange={setShowCreate} />
    </>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
        active
          ? "bg-zinc-100 text-zinc-900 font-medium"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function BalancePill({ balance }: { balance: number }) {
  if (balance === 0) return null;
  const isOwed = balance > 0;
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
        isOwed
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-600"
      )}
    >
      {isOwed ? "+" : ""}{formatMoney(Math.abs(balance))}
    </span>
  );
}
