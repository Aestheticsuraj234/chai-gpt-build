import { clerkMiddleware } from '@clerk/nextjs/server'

/**
 * Initializes Clerk for each matching request. Authentication and
 * authorization happen next to the protected data/routes, rather than by
 * matching URL strings here.
 */
export default clerkMiddleware()

/** Next.js middleware matcher — runs on app routes, API routes, and Clerk endpoints. */
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
}
