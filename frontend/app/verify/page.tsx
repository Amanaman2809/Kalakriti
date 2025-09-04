import { Suspense } from "react";
import VerifyPage from "@/pages/VerifyPage";

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <VerifyPage />
    </Suspense>
  );
}
