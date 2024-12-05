/* eslint-disable react/prop-types */
// components/OTPVerification.jsx
import { useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const OTPVerification = ({ email, onVerify, resendOTP }) => {
  const [otp, setOTP] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await onVerify(otp);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-xl">
      <CardHeader>
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          Enter Verification Code
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          We&apos;ve sent a verification code to {email}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              maxLength="6"
              required
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-2xl tracking-widest"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="flex w-full justify-center items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={resendOTP}
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Didn&apos;t receive code? Send again
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default OTPVerification;