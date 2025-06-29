"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "password">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  const requestOTP = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/otp/request-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to send OTP");
      }

      setResendDisabled(true);
      setCountdown(60); // 60 seconds countdown
      setSuccessMsg("OTP sent to your phone number");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic phone validation
    if (!/^[0-9]{10}$/.test(phone)) {
      setErrorMsg("Please enter a valid 10-digit phone number");
      return;
    }

    await requestOTP();
    setStep("otp");
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // Basic OTP validation
      if (!/^[0-9]{6}$/.test(otp)) {
        throw new Error("Please enter a valid 6-digit OTP");
      }

      // Optional: Verify OTP before proceeding to password step
      // This is optional since your API verifies OTP with password reset
      setStep("password");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // Password validation
      if (password !== confirmPassword) {
        throw new Error("Passwords don't match");
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/reset-pass`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      setSuccessMsg("Password reset successfully! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-6 text-center">
          <h2 className="text-2xl font-bold text-white">
            {step === "phone" && "Reset Password"}
            {step === "otp" && "Verify OTP"}
            {step === "password" && "New Password"}
          </h2>
          <p className="text-secondary mt-1">
            {step === "phone" && "Enter your phone number to receive OTP"}
            {step === "otp" && `Enter OTP sent to ${phone}`}
            {step === "password" && "Create a new password"}
          </p>
        </div>

        <div className="p-6">
          {/* Step indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === "phone" ? "bg-primary text-white" : "bg-secondary text-text"
              }`}>
                1
              </div>
              <div className={`w-12 h-1 ${step !== "phone" ? "bg-primary" : "bg-secondary"}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === "otp" ? "bg-primary text-white" : 
                step === "password" ? "bg-primary text-white" : "bg-secondary text-text"
              }`}>
                2
              </div>
              <div className={`w-12 h-1 ${step === "password" ? "bg-primary" : "bg-secondary"}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === "password" ? "bg-primary text-white" : "bg-secondary text-text"
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm mb-4">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm mb-4">
              {successMsg}
            </div>
          )}

          {/* Phone Step */}
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-text mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9999999999"
                  className="w-full px-4 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  pattern="[0-9]{10}"
                  inputMode="numeric"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-opacity-90 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-text mb-1">
                  OTP Code
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
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={requestOTP}
                    disabled={resendDisabled}
                    className="text-xs text-primary hover:underline disabled:text-gray-400"
                  >
                    {resendDisabled ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="px-4 py-2 text-primary font-medium rounded-lg hover:bg-accent transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary hover:bg-opacity-90 text-white font-medium rounded-lg transition duration-200"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </form>
          )}

          {/* Password Step */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-text"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-text mt-1 opacity-70">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep("otp")}
                  className="px-4 py-2 text-primary font-medium rounded-lg hover:bg-accent transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary hover:bg-opacity-90 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="text-center text-sm text-text mt-4">
            Remember your password?{" "}
            <a href="/login" className="text-primary font-medium hover:underline">
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}