import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, FolderOpen, Plus, FileText, ArrowRight } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface Application {
  id: number;
  service_id: number;
  status: string;
  service: {
    name: string;
    description: string;
  };
}

interface SidebarProps {
  onSelectApplication: (id: number) => void;
  activeAppId: number | null;
  refreshTrigger: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectApplication, activeAppId, refreshTrigger }) => {
  const { apiFetch } = useAuth();
  const [search, setSearch] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState('');

  // Fetch applications and services
  const loadData = async () => {
    try {
      const apps = await apiFetch('api/v1/applications');
      setApplications(apps);

      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const servs = await apiFetch(`api/v1/services${query}`);
      setServices(servs);
    } catch (err: any) {
      setError(err.message || 'Failed to load sidebar resources');
    }
  };

  useEffect(() => {
    loadData();
  }, [search, refreshTrigger]);

  const handleStartApplication = async (serviceId: number) => {
    try {
      const newApp = await apiFetch('api/v1/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service_id: serviceId }),
      });
      loadData();
      onSelectApplication(newApp.id);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize checking');
    }
  };

  return (
    <aside className="w-80 h-[calc(100vh-73px)] border-r border-slate-800 bg-slate-950/40 p-4 flex flex-col space-y-5 overflow-y-auto">
      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </span>
        <input
          type="text"
          placeholder="Search gov services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        />
      </div>

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

      {/* Active Applications */}
      <div className="flex-1 flex flex-col space-y-4 min-h-[200px]">
        <div className="flex items-center space-x-2 text-slate-400 px-1">
          <FolderOpen className="h-4 w-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider">Active Verifications</h2>
        </div>
        
        {applications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-6 text-center">
            <FileText className="h-8 w-8 text-slate-600 mb-2" />
            <p className="text-xs text-slate-500">No active verifications yet.</p>
            <p className="text-[10px] text-slate-600 mt-1">Search for a service below to begin!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => onSelectApplication(app.id)}
                className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                  activeAppId === app.id
                    ? 'bg-blue-600/10 border-blue-500/40 text-white shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div>
                  <h3 className="text-xs font-bold">{app.service.name}</h3>
                  <span className={`inline-block text-[9px] font-semibold mt-1 px-2 py-0.5 rounded-full uppercase ${
                    app.status === 'verified'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/30'
                      : app.status === 'rejected'
                      ? 'bg-red-950/60 text-red-400 border border-red-900/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <ArrowRight className={`h-3 w-3 ${activeAppId === app.id ? 'text-blue-400' : 'text-slate-600'}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Available Services */}
      <div className="flex flex-col space-y-3 pt-4 border-t border-slate-900">
        <div className="flex items-center space-x-2 text-slate-400 px-1">
          <Plus className="h-4 w-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider">Start Verification</h2>
        </div>

        {services.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-2">No matching services found.</p>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {services.map((service) => {
              // Only show option to start if not already created
              const alreadyStarted = applications.some((app) => app.service_id === service.id);
              return (
                <div
                  key={service.id}
                  className="p-2.5 rounded-xl border border-slate-900/50 bg-slate-950/60 flex items-center justify-between"
                >
                  <div className="flex-1 pr-2">
                    <h4 className="text-xs font-bold text-slate-200">{service.name}</h4>
                    <p className="text-[10px] text-slate-500 truncate max-w-[170px]">{service.description}</p>
                  </div>
                  <button
                    disabled={alreadyStarted}
                    onClick={() => handleStartApplication(service.id)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      alreadyStarted
                        ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-blue-600/10 hover:bg-blue-600 border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-white'
                    }`}
                    title={alreadyStarted ? 'Already Active' : 'Start Assessment'}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
