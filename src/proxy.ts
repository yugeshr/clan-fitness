import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // PWA manifest icons — extensionless, so unlike .webmanifest they aren't excluded by the
  // matcher below, and browsers fetch them unauthenticated during install-eligibility checks.
  "/icon-192",
  "/icon-512",
  "/icon-512-maskable",
  "/apple-icon",
  // Google's Digital Asset Links verifier fetches this unauthenticated to confirm the TWA
  // (Play Store wrapper) owns this domain — a redirect to sign-in here fails TWA verification.
  "/.well-known/assetlinks.json",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
