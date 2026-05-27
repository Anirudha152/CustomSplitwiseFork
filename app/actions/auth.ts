"use server";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

async function signInAndRedirect(
  email: string,
  password: string,
  callbackUrl: string
): Promise<string | null> {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) return "Invalid email or password.";
    throw e;
  }

  redirect(callbackUrl);
}

export async function signInWithCredentials(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) ?? "/app";

  const parsed = z
    .object({ email: z.string().email(), password: z.string().min(1) })
    .safeParse({ email, password });
  if (!parsed.success) return "Invalid email or password.";

  return signInAndRedirect(email, password, callbackUrl);
}

export async function signUpWithCredentials(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) ?? "/app";

  const parsed = z
    .object({
      name: z.string().min(1, "Name is required."),
      email: z.string().email("Invalid email address."),
      password: z.string().min(8, "Password must be at least 8 characters."),
    })
    .safeParse({ name, email, password });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input.";
  }

  let existing;
  try {
    existing = await db.user.findUnique({ where: { email } });
  } catch {
    return "Unable to reach the database. Try again in a moment.";
  }
  if (existing) return "An account with this email already exists.";

  const hash = await bcrypt.hash(password, 10);
  try {
    await db.user.create({ data: { email, name, password: hash } });
  } catch {
    return "Could not create your account. Try again in a moment.";
  }

  const signInError = await signInAndRedirect(email, password, callbackUrl);
  if (signInError) return "Account created but sign-in failed. Try signing in.";
  return null;
}
