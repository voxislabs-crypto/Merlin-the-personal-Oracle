import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900">
      <SignUp 
        forceRedirectUrl="/dashboard"
        fallbackRedirectUrl="/dashboard"
        routing="path"
        path="/sign-up"
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'bg-slate-900 border border-purple-500/30 shadow-2xl',
            headerTitle: 'text-amber-300',
            headerSubtitle: 'text-gray-400',
            socialButtonsBlockButton: 'border border-purple-500/30 hover:border-purple-500/50',
            formButtonPrimary: 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600',
            footerActionLink: 'text-amber-400 hover:text-amber-300',
          },
        }}
      />
    </div>
  );
}
