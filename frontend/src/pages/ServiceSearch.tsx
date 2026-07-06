import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Clock, CreditCard, ExternalLink, ArrowRight, X } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  fees_description: string;
  processing_time: string;
  official_url: string;
}

interface ServiceSearchProps {
  onStartApplication: (serviceId: number) => Promise<void>;
  applications: any[];
}

export const ServiceSearch: React.FC<ServiceSearchProps> = ({ onStartApplication, applications }) => {
  const { apiFetch } = useAuth();
  const [search, setSearch] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingStart, setLoadingStart] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchServices = async () => {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await apiFetch(`api/v1/services${query}`);
      setServices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load services.');
    }
  };

  useEffect(() => {
    fetchServices();
  }, [search]);

  const handleOpenDetails = async (service: Service) => {
    try {
      setLoadingDetails(true);
      const data = await apiFetch(`api/v1/services/${service.slug}`);
      setSelectedServiceDetails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load service guidelines.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleStart = async (serviceId: number) => {
    try {
      setLoadingStart(serviceId);
      await onStartApplication(serviceId);
    } catch (err: any) {
      setError(err.message || 'Failed to start checking process.');
    } finally {
      setLoadingStart(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-950/20 relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-blue-600/5 blur-[80px] pointer-events-none"></div>

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-8 border border-slate-900 bg-gradient-to-r from-slate-900/60 to-slate-950/40 relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">WORKSPACE HOMEPAGE</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Search Government Services</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Select a service below to review eligibility, step-by-step application guidelines, required documents, and commonly faced rejection reasons. Start an automated document audit workspace to check your scans.
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative max-w-xl">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="h-5 w-5 text-slate-500" />
        </span>
        <input
          type="text"
          placeholder="Type to search (e.g. Passport, PAN Card, Aadhaar)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/35 rounded-2xl text-xs text-red-400 max-w-xl">
          {error}
        </div>
      )}

      {/* Services Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Available Document Checkpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const alreadyStarted = applications.some((app: any) => app.service_id === service.id);
            return (
              <div
                key={service.id}
                className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-900 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{service.name}</h4>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{service.description}</p>
                  
                  <div className="pt-2 flex flex-col space-y-1.5 text-[10px] text-slate-500">
                    <span className="flex items-center"><Clock className="h-3 w-3 mr-1.5 text-blue-400" /> {service.processing_time}</span>
                    <span className="flex items-center"><CreditCard className="h-3 w-3 mr-1.5 text-indigo-400" /> {service.fees_description}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleOpenDetails(service)}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold transition-all text-center flex items-center justify-center"
                  >
                    {loadingDetails ? (
                      <div className="h-3 w-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'View Guidelines'
                    )}
                  </button>
                  <button
                    disabled={alreadyStarted || loadingStart === service.id}
                    onClick={() => handleStart(service.id)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      alreadyStarted
                        ? 'bg-slate-900 border border-slate-850 text-slate-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/10'
                    }`}
                  >
                    {loadingStart === service.id ? (
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : alreadyStarted ? (
                      <span>Active Assessment</span>
                    ) : (
                      <>
                        <span>Start Audit</span>
                        <ArrowRight className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guidelines Modal Drawer */}
      {selectedServiceDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl h-screen bg-slate-950 border-l border-slate-850 flex flex-col p-6 space-y-6 overflow-y-auto animate-slide-left shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full uppercase">Official Guidelines</span>
                <h3 className="text-xl font-bold text-white">{selectedServiceDetails.name} Guidelines</h3>
              </div>
              <button
                onClick={() => setSelectedServiceDetails(null)}
                className="p-1.5 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-6 text-xs text-slate-300">
              
              {/* Overview */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overview</h4>
                <p className="leading-relaxed text-slate-350">{selectedServiceDetails.description}</p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-semibold block">FEES</span>
                    <span className="text-xs font-bold text-slate-200">{selectedServiceDetails.fees_description}</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-semibold block">PROCESSING TIME</span>
                    <span className="text-xs font-bold text-slate-200">{selectedServiceDetails.processing_time}</span>
                  </div>
                </div>
              </div>

              {/* Requirements List */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Documents</h4>
                <div className="space-y-2">
                  {selectedServiceDetails.requirements?.map((req: any) => (
                    <div key={req.id} className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-200">{req.doc_type_required}</span>
                          {req.is_mandatory && (
                            <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.2 rounded font-bold uppercase">Mandatory</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{req.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps Accordion */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Application Steps</h4>
                <div className="space-y-2">
                  {selectedServiceDetails.application_steps?.map((step: any) => (
                    <div key={step.id} className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{step.step_number}. {step.step_title}</span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase">
                          {step.is_online ? 'online' : 'offline'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{step.step_description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Rejections */}
              {selectedServiceDetails.rejection_reasons?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-red-400">Common Rejection Warnings</h4>
                  <div className="space-y-2">
                    {selectedServiceDetails.rejection_reasons.map((rej: any) => (
                      <div key={rej.id} className="p-3 bg-red-950/10 border border-red-950/20 rounded-xl space-y-1">
                        <span className="font-bold text-red-400">{rej.reason_title}</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{rej.reason_description}</p>
                        <p className="text-[10px] text-slate-500"><span className="font-bold text-emerald-500/80">Mitigation:</span> {rej.mitigation_steps}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
              <a
                href={selectedServiceDetails.official_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 border border-slate-850 hover:bg-slate-900 rounded-xl font-bold text-[10px] text-slate-450 hover:text-white transition-all flex items-center"
              >
                Visit Official Site <ExternalLink className="h-3 w-3 ml-1.5" />
              </a>
              <button
                disabled={applications.some((app: any) => app.service_id === selectedServiceDetails.id)}
                onClick={() => {
                  handleStart(selectedServiceDetails.id);
                  setSelectedServiceDetails(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[10px] transition-all shadow-md shadow-blue-500/10"
              >
                Initialize Workspace
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
