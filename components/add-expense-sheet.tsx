"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ExpenseForm } from "@/components/expense-form";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string | null;
  image: string | null;
}

interface AddExpenseSheetProps {
  members: Member[];
  currentUserId: string;
  groupId: string | null;
  friendId: string | null;
}

export function AddExpenseSheet({ members, currentUserId, groupId, friendId }: AddExpenseSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={cn(buttonVariants(), "flex items-center gap-2")}>
        <Plus size={16} />
        Add expense
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New expense</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <ExpenseForm
            members={members}
            currentUserId={currentUserId}
            groupId={groupId}
            friendId={friendId}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
