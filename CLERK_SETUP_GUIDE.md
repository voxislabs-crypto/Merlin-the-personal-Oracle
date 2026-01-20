# Clerk Authentication Setup Guide

## 🎯 What Was Set Up

✅ **VS Code Clerk MCP Integration** - Model Context Protocol support
✅ **Clerk Authentication** - User sign-up, sign-in, and profile management
✅ **Middleware Protection** - Route protection and auth flow
✅ **Auth Helpers** - Utility functions for accessing user data
✅ **UI Components** - Sign-in, sign-up, and profile pages

---

## 📋 Files Created/Updated

### Created Files
- `middleware.ts` - Auth middleware for protected routes
- `lib/auth.ts` - Auth helper functions
- `app/sign-in/[[...sign-in]]/page.tsx` - Sign-in page
- `app/sign-up/[[...sign-up]]/page.tsx` - Sign-up page
- `app/profile/page.tsx` - User profile page
- `.env.clerk` - Clerk environment variables template

### Updated Files
- `.vscode/settings.json` - Added Clerk MCP configuration
- `app/layout.tsx` - Added ClerkProvider wrapper

---

## 🔑 Step 1: Get Your Clerk API Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or use existing one
3. Navigate to **API Keys** section
4. Copy:
   - `Publishable Key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret Key` → `CLERK_SECRET_KEY`

---

## 📝 Step 2: Update Environment Variables

Add these to your `.env.local` file:

```bash
# Clerk API Keys (from Step 1)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Clerk Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**Template available in `.env.clerk`**

---

## 🚀 Step 3: Test the Setup

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Try the authentication flows:
   - **Sign Up**: http://localhost:5000/sign-up
   - **Sign In**: http://localhost:5000/sign-in
   - **Profile**: http://localhost:5000/profile
   - **Dashboard**: http://localhost:5000/dashboard

---

## 🔐 Protected Routes

These routes are currently **public** (configurable in `middleware.ts`):
- `/` - Home page
- `/astro-calculator` - Calculator
- `/dashboard` - Dashboard
- `/enhanced-dashboard` - Enhanced dashboard
- All API endpoints

To protect a route, remove it from the `publicRoutes` array in `middleware.ts`.

---

## 📚 Available Auth Functions

### In `lib/auth.ts`:

```typescript
// Get current authenticated user
const user = await getCurrentUser();

// Check if user is authenticated
const isAuth = await isAuthenticated();

// Get current auth session
const session = await getAuthSession();

// Get user ID from current session
const userId = getUserId();
```

### In React Components:

```typescript
'use client';
import { useUser, useAuth } from "@clerk/nextjs";

export function MyComponent() {
  const { user, isLoaded } = useUser();
  const { userId } = useAuth();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;
  
  return <div>Hello, {user.firstName}!</div>;
}
```

---

## 🎨 UI Components

### Sign-In Page
- Location: `/sign-in`
- Styled with cosmic theme (matching Merlin aesthetic)
- Auto-redirects to dashboard after sign-in

### Sign-Up Page
- Location: `/sign-up`
- Styled with cosmic theme
- Auto-redirects to dashboard after sign-up

### Profile Page
- Location: `/profile`
- Displays user information
- Shows user ID and account creation date
- Links to dashboard and home

### User Button (Global)
- Can be added to any component:
  ```tsx
  import { UserButton } from "@clerk/nextjs";
  
  export function Header() {
    return <UserButton />;
  }
  ```

---

## 🔌 VS Code Clerk MCP

The Clerk Model Context Protocol is now configured in VS Code settings.

**Benefits:**
- Direct access to Clerk documentation
- Code completions for Clerk functions
- Integration tips and examples
- Real-time API reference

**Location**: `.vscode/settings.json`

---

## 🌐 Middleware Configuration

The middleware in `middleware.ts`:

1. **Protects routes** - Ensures auth flow is enforced
2. **Allows public routes** - List of routes accessible without auth
3. **Ignores webhook routes** - For Clerk webhooks and external services

**To protect a new route:**
Remove it from `publicRoutes` array:
```typescript
publicRoutes: [
  "/",
  "/astro-calculator",
  // Remove these to protect:
  // "/dashboard",
  // "/enhanced-dashboard",
],
```

---

## 🔗 Integration Examples

### Protect an API Route

```typescript
// app/api/user-chart/route.ts
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // Your protected logic here
  return NextResponse.json({ userId });
}
```

### Protect a Page Component

```typescript
// app/my-saved-charts/page.tsx
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function SavedChartsPage() {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  return <div>Your saved charts here</div>;
}
```

### Use User Data in Components

```typescript
'use client';
import { useUser } from "@clerk/nextjs";

export function UserGreeting() {
  const { user } = useUser();
  
  return (
    <div>Welcome, {user?.firstName}! 🎉</div>
  );
}
```

---

## 🐛 Troubleshooting

### "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
- Add Clerk environment variables to `.env.local`
- Restart dev server: `npm run dev`

### Sign-in not working
- Check Clerk Dashboard settings
- Verify environment variables are set
- Clear browser cache and cookies
- Check browser console for errors

### Redirect loops
- Ensure `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` is not `/sign-in`
- Check middleware routes
- Verify `publicRoutes` are correctly configured

### MCP not showing in VS Code
- Close and reopen VS Code
- Check `.vscode/settings.json` for correct format
- Ensure VS Code has Clerk MCP extension/support

---

## 📖 Next Steps

1. ✅ Get Clerk API keys from dashboard
2. ✅ Update `.env.local` with keys
3. ✅ Test sign-up at `/sign-up`
4. ✅ Test sign-in at `/sign-in`
5. ✅ View profile at `/profile`
6. ✅ Protect routes in `middleware.ts`
7. ✅ Integrate user data in your components

---

## 🔗 Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Clerk Support](https://clerk.com/support)

---

## ✅ Status

✅ **Clerk MCP** configured in VS Code
✅ **Authentication** set up in Next.js app
✅ **Sign-up/Sign-in** pages created
✅ **Profile** page created
✅ **Middleware** configured
✅ **Auth helpers** available
✅ **Environment** template provided

**Next**: Add your Clerk API keys to `.env.local` and test! 🚀
