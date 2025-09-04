"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const phone = searchParams?.get("phone");
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    // Fire OTP request as soon as user lands
    if (phone) {
      requestOTP();
    }
  }, [phone]);

  useEffect(() => {
    if (resendDisabled && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  const requestOTP = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/otp/request-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        },
      );
      setResendDisabled(true);
      setCountdown(60);
    } catch (err) {
      console.log(err);
      setErrorMsg("Failed to send OTP. Please try again.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/otp/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setSuccessMsg("Verified! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!phone) {
    return (
      <div className="min-h-screen bg-accent flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-background rounded-xl shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold text-primary mb-2">Error</h2>
          <p className="text-red-600">Missing phone number</p>
          <button
            onClick={() => router.push("/signup")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition"
          >
            Go Back to Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Verify Your Phone</h2>
          <p className="text-secondary mt-1">
            We&quot;ve sent a 6-digit code to {phone}
          </p>
        </div>

        <form onSubmit={handleVerify} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-text mb-1"
              >
                Enter OTP Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 text-center text-xl border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                maxLength={6}
                pattern="\d{6}"
                inputMode="numeric"
              />
              <p className="text-xs text-text mt-1 opacity-70">
                Enter the 6-digit code sent to your phone
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-opacity-90 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </button>

          <div className="text-center text-sm text-text">
            Didn&quot;t receive the code?{" "}
            <button
              type="button"
              onClick={requestOTP}
              disabled={resendDisabled}
              className={`font-medium ${resendDisabled ? "text-gray-400" : "text-primary hover:underline"}`}
            >
              {resendDisabled ? `Resend in ${countdown}s` : "Resend OTP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
