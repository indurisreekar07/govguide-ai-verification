import React from 'react';
import { ShieldCheck, FileSearch, Sparkles, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingProps {
  onStart: (view: 'login' | 'register') => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      
      {/* Background premium glow effects */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[150px] animate-glow pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[150px] animate-glow [animation-delay:2s] pointer-events-none"></div>

      {/* Landing Header */}
      <header className="glass-panel sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-extrabold text-lg">GG</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              GovGuide <span className="text-blue-500 font-extrabold ml-1">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Verification Assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => onStart('login')}
            className="text-xs font-bold text-slate-350 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => onStart('register')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10"
          >
            Start Assessment
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center space-y-8 relative z-10">
        <div className="inline-flex items-center space-x-2 bg-blue-950/40 border border-blue-900/50 px-3.5 py-1 rounded-full text-xs text-blue-400 font-semibold mb-2">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Empowered by Gemini 1.5 Flash</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] text-gradient-primary">
          Verify Your Government Documents Instantly with AI
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Pre-verify your IDs and proofs before submission. GovGuide AI runs OCR, checks expiration states, alerts name mismatches, and answers process guidelines using AI.
        </p>

        <div className="pt-4 flex justify-center space-x-4">
          <button 
            onClick={() => onStart('register')}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center space-x-2"
          >
            <span>Begin Free Assessment</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onStart('login')}
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all"
          >
            Login to Workspace
          </button>
        </div>

        {/* Hero Product Mockup Preview */}
        <div className="pt-12 max-w-4xl mx-auto animate-slide-up">
          <div className="glass-panel rounded-3xl p-2 border border-slate-800 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 rounded-3xl"></div>
            <div className="bg-slate-950 rounded-2xl border border-slate-900 p-6 text-left grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                  <h3 className="text-xs font-bold text-slate-200">Passport Checklist Assessment</h3>
                  <span className="text-[10px] font-bold text-blue-400">66% Verified</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Aadhaar Card (Identity Proof)</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-900/30">VALID</span>
                  </div>
                  <div className="p-3 bg-red-950/10 border border-red-900/20 rounded-xl flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-red-400">
                        <span className="h-4 w-4 rounded-full bg-red-950 flex items-center justify-center text-red-500 font-bold text-[10px]">!</span>
                        <span>Rent Agreement (Address Proof)</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-red-950/60 text-red-400 font-bold border border-red-900/30">EXPIRED</span>
                    </div>
                    <p className="text-[10px] text-slate-500 pl-6">Document expired on 2026-05-01. Please upload a valid utility bill or new lease agreement.</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-6 w-6 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">AI Assistant</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">"Based on your uploads, the name 'Dhanush K' matches your profile 'Dhanush Kumar' at 89%. You do not need a marriage certificate or name change affidavit."</p>
                </div>
                <div className="pt-4 border-t border-slate-900 text-[10px] text-slate-500">
                  Ready to assist in real-time.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-950 border-t border-slate-900 py-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Engineered for Verification Safety</h2>
            <p className="text-xs sm:text-sm text-slate-400">Avoid queue rejections, fee losses, and spelling delays with instant pre-validation checkpoints.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            
            {/* Feature 1 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4 hover:border-slate-800 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                <FileSearch className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Tesseract OCR Reader</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically extracts text content from uploaded files (JPEG, PNG, PDF) using advanced open-source optical character recognition.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4 hover:border-slate-800 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Smart Match Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies rule-based validation checking, including fuzzy name comparison (Levenshtein distance), expiry date checks, and document type detection.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4 hover:border-slate-800 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">AI Guidelines Chatbot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Talk to a specialized chatbot loaded with your specific checklist status, official FAQs, and official application steps to clear up doubts.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 GovGuide AI. Dedicated to facilitating hassle-free government applications. Not affiliated with any government department.</p>
      </footer>

    </div>
  );
};
