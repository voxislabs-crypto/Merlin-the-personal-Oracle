import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main style={{ width: '100%', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <SignIn 
        forceRedirectUrl="/checkout-subscription" 
        routing="path" 
        path="/sign-in" 
        appearance={{ elements: { rootBox: { width: "400px" } } }} 
      />
    </main>
  );
}
