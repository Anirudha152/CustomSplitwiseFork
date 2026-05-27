"use client";

import { useActionState } from "react";
import {
  signInWithCredentials,
  signUpWithCredentials,
} from "@/app/actions/auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SignInTabs({ callbackUrl }: { callbackUrl: string }) {
  const [signinError, signinAction, signinPending] = useActionState(
    signInWithCredentials,
    null
  );
  const [signupError, signupAction, signupPending] = useActionState(
    signUpWithCredentials,
    null
  );

  return (
    <Tabs defaultValue="signin">
      <TabsList className="w-full mb-4">
        <TabsTrigger value="signin" className="flex-1">
          Sign in
        </TabsTrigger>
        <TabsTrigger value="signup" className="flex-1">
          Sign up
        </TabsTrigger>
      </TabsList>

      <TabsContent value="signin" className="space-y-4">
        <form action={signinAction} className="space-y-3">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          {signinError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {signinError}
            </p>
          )}
          <div className="space-y-1">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={signinPending}>
            {signinPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="signup" className="space-y-4">
        <form action={signupAction} className="space-y-3">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          {signupError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {signupError}
            </p>
          )}
          <div className="space-y-1">
            <Label htmlFor="signup-name">Name</Label>
            <Input
              id="signup-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </div>
          <Button type="submit" className="w-full" disabled={signupPending}>
            {signupPending ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
