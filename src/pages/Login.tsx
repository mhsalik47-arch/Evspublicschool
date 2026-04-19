import React, { useState, useEffect, useRef } from 'react';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { School, Phone, ShieldCheck, ArrowRight, MessageSquare } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const navigate = useNavigate();
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
          recaptchaRef.current = null;
        } catch (e) {
          console.error('Error in cleanup:', e);
        }
      }
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return toast.error('Please enter a phone number');
    
    setLoading(true);
    try {
      // Clear any existing instance and container content
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch (e) {
          console.error('Error clearing recaptcha:', e);
        }
      }
      
      const container = document.getElementById('recaptcha-container');
      if (container) container.innerHTML = '';

      // Create fresh instance
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
      recaptchaRef.current = verifier;
      
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast.success('OTP sent to your mobile!');
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to send OTP. Please check the number.');
      
      // Reset on error
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
          recaptchaRef.current = null;
          const container = document.getElementById('recaptcha-container');
          if (container) container.innerHTML = '';
        } catch (e) {
          console.error('Error resetting recaptcha:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !confirmationResult) return;

    setLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Logged in with Google!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-stone-50 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-stone-900 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-600 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 border border-stone-100 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Staff Portal</h1>
          <p className="text-stone-500 mt-2">Login with your mobile number</p>
        </div>

        <div id="recaptcha-container"></div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700 ml-1">Mobile Number</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">+91</div>
                <input
                  required
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-14 pr-4 py-4 focus:ring-2 focus:ring-stone-900 outline-none transition-all text-lg tracking-wider"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl hover:bg-stone-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700 ml-1">Enter 6-digit OTP</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  required
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-stone-900 outline-none transition-all text-xl tracking-[0.5em] font-bold text-center"
                  placeholder="000000"
                />
              </div>
              <p className="text-xs text-stone-400 text-center mt-2">
                OTP sent to +91 {phoneNumber}
              </p>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Verify & Login
                  <ShieldCheck className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-stone-500 text-sm font-medium hover:text-stone-900 transition-colors"
            >
              Change Phone Number
            </button>
          </form>
        )}

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-stone-400 font-bold tracking-widest">Or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-stone-100 text-stone-700 font-bold py-4 px-6 rounded-2xl hover:bg-stone-50 hover:border-stone-200 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>

        <div className="mt-10 pt-8 border-t border-stone-50 text-center">
          <p className="text-xs text-stone-300 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3" />
            Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}
