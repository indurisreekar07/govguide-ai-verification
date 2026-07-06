import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, FileText, ChevronRight, Save } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  fees_description: string;
  processing_time: string;
  official_url: string;
}

export const Admin: React.FC = () => {
  const { apiFetch } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form States for Service
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [fees, setFees] = useState('');
  const [time, setTime] = useState('');
  const [url, setUrl] = useState('');

  // Additional detail lists for active service
  const [requirements, setRequirements] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);

  // Sub-forms
  const [newReqDoc, setNewReqDoc] = useState('');
  const [newReqMandatory, setNewReqMandatory] = useState(true);
  const [newFAQQuestion, setNewFAQQuestion] = useState('');
  const [newFAQAnswer, setNewFAQAnswer] = useState('');

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('api/v1/services');
      setServices(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleSelectService = async (service: Service) => {
    setSelectedService(service);
    setName(service.name);
    setSlug(service.slug);
    setDescription(service.description);
    setFees(service.fees_description || '');
    setTime(service.processing_time || '');
    setUrl(service.official_url || '');

    // Load full details
    try {
      const details = await apiFetch(`api/v1/services/${service.slug}`);
      setRequirements(details.requirements || []);
      setFaqs(details.faqs || []);
    } catch (err) {
      console.error('Failed to load service sub-attributes:', err);
    }
  };

  const handleCreateNew = () => {
    setSelectedService(null);
    setName('');
    setSlug('');
    setDescription('');
    setFees('');
    setTime('');
    setUrl('');
    setRequirements([]);
    setFaqs([]);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      name,
      slug,
      description,
      fees_description: fees,
      processing_time: time,
      official_url: url
    };

    try {
      if (selectedService) {
        // Update
        const updated = await apiFetch(`api/v1/admin/services/${selectedService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setSuccess('Service details updated successfully.');
        loadServices();
        setSelectedService(updated);
      } else {
        // Create
        const created = await apiFetch('api/v1/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setSuccess('New government service registered.');
        loadServices();
        handleSelectService(created);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save service.');
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService || !window.confirm(`Are you sure you want to delete ${selectedService.name}?`)) return;
    try {
      await apiFetch(`api/v1/admin/services/${selectedService.id}`, { method: 'DELETE' });
      setSuccess('Service deleted.');
      handleCreateNew();
      loadServices();
    } catch (err: any) {
      setError(err.message || 'Failed to delete service.');
    }
  };

  // Requirements CRUD
  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !newReqDoc.trim()) return;

    try {
      const added = await apiFetch(`api/v1/admin/services/${selectedService.id}/requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_type_required: newReqDoc,
          is_mandatory: newReqMandatory,
          description: `Required for verifying ${newReqDoc}.`
        })
      });
      setRequirements(prev => [...prev, added]);
      setNewReqDoc('');
    } catch (err: any) {
      setError(err.message || 'Failed to add document requirement.');
    }
  };

  const handleRemoveRequirement = async (id: number) => {
    try {
      await apiFetch(`api/v1/admin/requirements/${id}`, { method: 'DELETE' });
      setRequirements(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to remove requirement.');
    }
  };

  // FAQ CRUD
  const handleAddFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !newFAQQuestion.trim() || !newFAQAnswer.trim()) return;

    try {
      const added = await apiFetch(`api/v1/admin/services/${selectedService.id}/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newFAQQuestion, answer: newFAQAnswer })
      });
      setFaqs(prev => [...prev, added]);
      setNewFAQQuestion('');
      setNewFAQAnswer('');
    } catch (err: any) {
      setError(err.message || 'Failed to add FAQ.');
    }
  };

  const handleRemoveFAQ = async (id: number) => {
    try {
      await apiFetch(`api/v1/admin/faqs/${id}`, { method: 'DELETE' });
      setFaqs(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to remove FAQ.');
    }
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-73px)] overflow-hidden">
      {/* Left List Pane */}
      <div className="w-80 border-r border-slate-800 bg-slate-950/40 p-4 flex flex-col space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Services</h2>
          <button 
            onClick={handleCreateNew}
            className="p-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg border border-blue-500/20 hover:border-blue-500 transition-all text-[10px] font-bold flex items-center"
          >
            <Plus className="h-3 w-3 mr-1" /> New Service
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 text-center py-4">Loading...</p>
        ) : (
          <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => handleSelectService(s)}
                className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                  selectedService?.id === s.id
                    ? 'bg-blue-600/10 border-blue-500/40 text-white'
                    : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">{s.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">slug: {s.slug}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Detailed Edit Workspace */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center">
            <FileText className="h-5 w-5 mr-2.5 text-blue-500" />
            {selectedService ? `Edit Service: ${selectedService.name}` : 'Register New Government Service'}
          </h2>
          {selectedService && (
            <button
              onClick={handleDeleteService}
              className="px-3.5 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center border border-red-500/30 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Service
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/35 p-3 rounded-xl">{error}</p>}
        {success && <p className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/35 p-3 rounded-xl">{success}</p>}

        <form onSubmit={handleSaveService} className="grid grid-cols-1 md:grid-cols-2 gap-4 glass-panel p-5 rounded-2xl">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Service Name</label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Birth Certificate" 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Service Slug (URL-friendly)</label>
            <input 
              type="text" 
              required
              value={slug} 
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="e.g. birth-certificate" 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Service Description</label>
            <textarea 
              required
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the service context..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Fees Description</label>
            <input 
              type="text" 
              value={fees} 
              onChange={e => setFees(e.target.value)}
              placeholder="e.g. Rs. 100" 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Processing Time</label>
            <input 
              type="text" 
              value={time} 
              onChange={e => setTime(e.target.value)}
              placeholder="e.g. 5 to 7 days" 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Official Application URL</label>
            <input 
              type="url" 
              value={url} 
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.gov.in" 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2 pt-2 flex justify-end">
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center transition-all shadow-md shadow-blue-500/10"
            >
              <Save className="h-4 w-4 mr-2" /> Save Service Settings
            </button>
          </div>
        </form>

        {selectedService && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document Requirements CRUD Pane */}
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Document Checklist Requirements</h3>
              
              <form onSubmit={handleAddRequirement} className="flex items-end gap-3 pb-3 border-b border-slate-800">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[9px] font-semibold text-slate-500 uppercase">Document Type Required</label>
                  <input 
                    type="text" 
                    required
                    value={newReqDoc}
                    onChange={e => setNewReqDoc(e.target.value)}
                    placeholder="e.g. Passport Photo" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div className="flex items-center space-x-2 py-2 pr-2 shrink-0">
                  <input 
                    type="checkbox" 
                    id="mandatory" 
                    checked={newReqMandatory}
                    onChange={e => setNewReqMandatory(e.target.checked)}
                    className="h-4 w-4 bg-slate-900 border-slate-800 rounded accent-blue-500"
                  />
                  <label htmlFor="mandatory" className="text-xs font-semibold text-slate-400 cursor-pointer">Mandatory</label>
                </div>
                <button 
                  type="submit"
                  className="px-3.5 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-blue-500/20"
                >
                  Add
                </button>
              </form>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {requirements.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-2">No documents mapped yet.</p>
                ) : (
                  requirements.map(r => (
                    <div key={r.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-900 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-200">{r.doc_type_required}</span>
                        {r.is_mandatory && <span className="ml-2 text-[9px] font-bold px-1.5 py-0.2 bg-blue-500/10 text-blue-400 rounded">Mandatory</span>}
                      </div>
                      <button 
                        onClick={() => handleRemoveRequirement(r.id)}
                        className="p-1 bg-red-950/20 hover:bg-red-950 border border-red-900/20 hover:border-red-900 text-red-400 rounded-lg transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* FAQs CRUD Pane */}
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Frequently Asked Questions</h3>
              
              <form onSubmit={handleAddFAQ} className="space-y-3 pb-3 border-b border-slate-800">
                <input 
                  type="text" 
                  required
                  value={newFAQQuestion}
                  onChange={e => setNewFAQQuestion(e.target.value)}
                  placeholder="Enter FAQ Question..." 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                />
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    required
                    value={newFAQAnswer}
                    onChange={e => setNewFAQAnswer(e.target.value)}
                    placeholder="Enter FAQ Answer..." 
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                  <button 
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-blue-500/20"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {faqs.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-2">No FAQs configured yet.</p>
                ) : (
                  faqs.map(f => (
                    <div key={f.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-900 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-250">{f.question}</span>
                        <button 
                          onClick={() => handleRemoveFAQ(f.id)}
                          className="p-1 bg-red-950/20 hover:bg-red-950 border border-red-900/20 hover:border-red-900 text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{f.answer}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
