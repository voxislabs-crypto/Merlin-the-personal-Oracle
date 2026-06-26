import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900">
      <SignUp 
        fallbackRedirectUrl="/dashboard"
        routing="path"
        path="/sign-up"
        appearance={{
          variables: {
            colorText: '#f3f4f6',
            colorInputText: '#f3f4f6',
            colorInputBackground: '#0f172a',
            colorNeutral: '#94a3b8',
          },
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'bg-slate-900 border border-purple-500/30 shadow-2xl',
            headerTitle: 'text-amber-300',
            headerSubtitle: 'text-gray-400',
            socialButtonsBlockButton: 'bg-slate-800 text-white border border-purple-500/40 hover:border-purple-500/70 hover:bg-slate-700',
            socialButtonsBlockButtonText: 'text-white',
            formButtonPrimary: 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600',
            formFieldLabel: 'text-gray-200',
            formFieldInput: 'bg-slate-800 text-white border border-purple-500/40 placeholder:text-gray-400',
            footerActionLink: 'text-amber-400 hover:text-amber-300',
          },
        }}
      />
    </div>
  );
}
