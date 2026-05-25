"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createGroup } from "@/app/actions/groups";

export function CreateGroupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create a group</DialogTitle>
        </DialogHeader>
        <form action={createGroup} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Group name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Goa Trip, Roommates…"
              autoFocus
              required
            />
          </div>
          <Button type="submit" className="w-full">Create group</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
