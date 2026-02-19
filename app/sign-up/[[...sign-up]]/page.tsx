import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main style={{ width: '100%', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <SignUp 
        forceRedirectUrl="/checkout-subscription" 
        routing="path" 
        path="/sign-up" 
        appearance={{ elements: { rootBox: { width: "400px" } } }} 
      />
    </main>
  );
}
