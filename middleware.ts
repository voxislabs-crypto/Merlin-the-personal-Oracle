import { authMiddleware } from "@clerk/nextjs";

const publicRoutes = [
  "/", 
  "/sign-in(.*)", 
  "/sign-up(.*)", 
  "/checkout-subscription(.*)",
  "/api/create-checkout-session(.*)", 
  "/api/stripe/webhook(.*)", 
  "/api/stripe/create-subscription-session(.*)",
  "/__clerk(.*)",
  "/sign-in/sso-callback(.*)",
  "/privacy(.*)",
  "/terms(.*)",
];

export default authMiddleware({
  publicRoutes,
  afterAuth(auth, req) {
    const { userId } = auth;
    const url = new URL(req.url);
    const isOnSignIn = url.pathname.startsWith("/sign-in");
    const isOnSignUp = url.pathname.startsWith("/sign-up");
    const isOnCheckout = url.pathname.startsWith("/checkout");

    // Redirect authenticated users away from sign-in/sign-up
    if (userId && isOnSignIn) {
      return Response.redirect(new URL("/dashboard", req.url));
    }

    if (userId && isOnSignUp) {
      return Response.redirect(new URL("/dashboard", req.url));
    }
  },
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

