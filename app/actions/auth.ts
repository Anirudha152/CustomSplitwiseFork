"use server";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";



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

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (e) {
    if (e instanceof AuthError) return "Invalid email or password.";
    throw e;
  }
  return null;
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

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return "An account with this email already exists.";

  const hash = await bcrypt.hash(password, 10);
  await db.user.create({ data: { email, name, password: hash } });

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (e) {
    if (e instanceof AuthError) return "Account created but sign-in failed. Try signing in.";
    throw e;
  }
  return null;
}
