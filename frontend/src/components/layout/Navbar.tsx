import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onAdminToggle: () => void;
  showAdmin: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onAdminToggle, showAdmin }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="glass-panel sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/70 backdrop-blur-md">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="text-white font-extrabold text-lg">GG</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
            GovGuide <span className="text-blue-500 font-extrabold ml-1">AI</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Application Verification Assistant</p>
        </div>
      </div>

      {user && (
        <div className="flex items-center space-x-4">
          {user.is_admin && (
            <button
              onClick={onAdminToggle}
              className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center transition-all ${
                showAdmin 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Shield className="h-4 w-4 mr-2" />
              {showAdmin ? 'User Dashboard' : 'Admin Panel'}
            </button>
          )}

          <div className="flex items-center space-x-3 bg-slate-900/60 pl-3 pr-4 py-1.5 rounded-full border border-slate-800">
            <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <UserIcon className="h-4 w-4 text-slate-300" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-200">{user.full_name}</p>
              <p className="text-[10px] text-slate-400 leading-none">{user.is_admin ? 'Administrator' : 'Applicant'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 bg-slate-900/60 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/50 rounded-full transition-all duration-200"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
  );
};
