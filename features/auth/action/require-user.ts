"use server"

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { onBoard } from "./onboard";

/**
 * Ensures the request is authenticated and has a matching local user record.
 *
 * @returns The Prisma `User` linked to the current Clerk session.
 */
export async function requireUser() {
    const { userId } = await auth.protect();

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // Next.js can render layouts and pages concurrently. A newly signed-in
    // user may therefore reach a server action before the layout's sync has
    // completed. Create the record here as well so protected actions are safe
    // on their own and the first request does not fail with a 500.
    return user ?? onBoard();
}
  
