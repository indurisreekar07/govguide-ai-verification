import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User as UserIcon, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onBackToLanding: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onBackToLanding }) => {
  const { registerUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerUser(email, fullName, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      
      {/* Background Premium Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px] animate-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px] animate-glow [animation-delay:2s]"></div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-slate-800/80 shadow-2xl relative z-10 animate-slide-up">
        
        {success ? (
          <div className="text-center space-y-4 py-6">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto animate-bounce" />
            <div>
              <h2 className="text-xl font-bold text-white">Account Created!</h2>
              <p className="text-xs text-slate-400 mt-2">Your GovGuide AI workspace is ready. You can now log in using your credentials.</p>
            </div>
            <button
              onClick={onSwitchToLogin}
              className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col items-center text-center space-y-2 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Create Account</h2>
                <p className="text-xs text-slate-400 mt-1">Register to start verifying your application documents</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-950/20 border border-red-900/35 rounded-xl text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <UserIcon className="h-4 w-4 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Dhanush Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-850 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Register Account</span>
                )}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center space-y-3">
              <button
                onClick={onSwitchToLogin}
                className="w-full flex items-center justify-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                <span>Back to Sign In</span>
              </button>
              <button
                onClick={onBackToLanding}
                className="text-slate-500 hover:text-slate-350 transition-colors font-medium text-[11px]"
              >
                ← Back to Homepage
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
