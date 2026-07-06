import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Upload, 
  FileCheck, 
  Send, 
  ExternalLink,
  Clock,
  CircleDot,
  CreditCard,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';

interface ChecklistItem {
  requirement_id: number;
  doc_type_required: string;
  is_mandatory: boolean;
  description: string;
  status: string;
  error_details: string | null;
  last_uploaded_at: string | null;
  document_id: number | null;
}

interface ChecklistData {
  application_id: number;
  service_name: string;
  progress_percentage: number;
  checklist: ChecklistItem[];
  next_steps: string[];
}

interface Message {
  id: number;
  sender: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface DashboardProps {
  applicationId: number;
  onRefreshSidebar: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ applicationId, onRefreshSidebar }) => {
  const { apiFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(null);
  const [serviceDetails, setServiceDetails] = useState<any>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  
  // Accordion Toggles
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // Chatbot State
  const [chatSessionId, setChatSessionId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch checklist status
      const checklist = await apiFetch(`api/v1/applications/${applicationId}/checklist`);
      setChecklistData(checklist);

      // Fetch full service details (FAQs, eligibility, steps)
      const appDetails = await apiFetch(`api/v1/applications/${applicationId}`);
      const serviceSlug = appDetails.service.slug;
      const details = await apiFetch(`api/v1/services/${serviceSlug}`);
      setServiceDetails(details);

      // Load or create chat session
      const sessions = await apiFetch('api/v1/chat/sessions');
      let activeSession = sessions.find((s: any) => s.title.includes(checklist.service_name));
      if (!activeSession) {
        activeSession = await apiFetch('api/v1/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Verification Assistance - ${checklist.service_name}` })
        });
      }
      setChatSessionId(activeSession.id);
      
      const sessionHistory = await apiFetch(`api/v1/chat/sessions/${activeSession.id}`);
      setChatMessages(sessionHistory.messages || []);
    } catch (err) {
      console.error('Error fetching dashboard details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [applicationId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFileUploadClick = (reqId: number) => {
    fileInputRefs.current[reqId]?.click();
  };

  const pollVerificationStatus = async (reqId: number) => {
    let attempts = 0;
    const maxAttempts = 15;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const checklist = await apiFetch(`api/v1/applications/${applicationId}/checklist`);
        const item = checklist.checklist.find((i: any) => i.requirement_id === reqId);
        
        // Update checklist data dynamically
        setChecklistData(checklist);
        
        if (!item || item.status !== 'pending' || attempts >= maxAttempts) {
          clearInterval(interval);
          setUploadingId(null);
          onRefreshSidebar();
          // Reload overall details
          const appDetails = await apiFetch(`api/v1/applications/${applicationId}`);
          const serviceSlug = appDetails.service.slug;
          const details = await apiFetch(`api/v1/services/${serviceSlug}`);
          setServiceDetails(details);
        }
      } catch (err) {
        console.error('Error during status polling:', err);
        clearInterval(interval);
        setUploadingId(null);
      }
    }, 1000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, reqId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingId(reqId);
      
      // Optimistically update checklist item to pending
      if (checklistData) {
        setChecklistData({
          ...checklistData,
          checklist: checklistData.checklist.map(item =>
            item.requirement_id === reqId ? { ...item, status: 'pending' } : item
          )
        });
      }

      await apiFetch(`api/v1/applications/${applicationId}/upload?requirement_id=${reqId}`, {
        method: 'POST',
        body: formData,
      });

      // Poll status
      await pollVerificationStatus(reqId);
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadingId(null);
      await loadDashboardData();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatSessionId) return;

    const userText = chatInput;
    setChatInput('');
    setSendingMsg(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: Date.now(),
      sender: 'user',
      content: userText,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await apiFetch(
        `api/v1/chat/sessions/${chatSessionId}/messages?application_id=${applicationId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: userText })
        }
      );
      setChatMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, response]);
    } catch (err) {
      console.error('Failed to get chatbot response:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/10">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400 font-medium">Assembling checklist and running document verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-[calc(100vh-73px)] overflow-hidden">
      {/* Middle Pane - Main Dashboard */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Top Service Stats Summary Header */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{checklistData?.service_name} Verification Workspace</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">{serviceDetails?.description}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1.5 text-blue-400" /> {serviceDetails?.processing_time}</span>
              <span className="flex items-center"><CreditCard className="h-3.5 w-3.5 mr-1.5 text-indigo-400" /> {serviceDetails?.fees_description}</span>
              <a 
                href={serviceDetails?.official_url} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Official Website
              </a>
            </div>
          </div>
          
          {/* Circular Progress Widget */}
          <div className="flex items-center space-x-4 pr-4 border-l border-slate-800 pl-4 md:pl-8">
            <div className="text-right">
              <span className="text-2xl font-extrabold text-white">{checklistData?.progress_percentage}%</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verification Score</p>
            </div>
            <div className="relative h-16 w-16">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-500 transition-all duration-500 ease-out"
                  strokeDasharray={`${checklistData?.progress_percentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 2-Column Content: Checklist (Left) & Reference Guides (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Required Document Checklist */}
          <div className="xl:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <FileCheck className="h-4 w-4 mr-2 text-blue-500" />
              Document Checklist
            </h3>
            
            {checklistData?.checklist.map((item) => (
              <div 
                key={item.requirement_id}
                className={`glass-panel rounded-2xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                  item.status === 'valid' 
                    ? 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-950/5' 
                    : item.status === 'missing'
                    ? 'border-slate-800 hover:border-slate-700'
                    : item.status === 'pending'
                    ? 'border-blue-500/20 hover:border-blue-500/40 bg-blue-950/5 animate-pulse'
                    : 'border-red-500/20 hover:border-red-500/40 bg-red-950/5'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {item.status === 'valid' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                    {item.status === 'missing' && <CircleDot className="h-5 w-5 text-slate-500" />}
                    {item.status === 'pending' && <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-1"></div>}
                    {['expired', 'invalid', 'unreadable'].includes(item.status) && <XCircle className="h-5 w-5 text-red-500" />}
                    <h4 className="text-sm font-bold text-white">{item.doc_type_required}</h4>
                    {item.is_mandatory && (
                      <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase">Mandatory</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 pl-7">{item.description}</p>
                  
                  {/* Specific Document Error Detail Alerts */}
                  {item.error_details && (
                    <div className="mt-2 pl-7 flex items-start space-x-1.5 text-xs text-red-400 bg-red-950/20 p-2.5 rounded-xl border border-red-900/30">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{item.error_details}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 pl-7 md:pl-0">
                  <input
                    type="file"
                    ref={(el) => (fileInputRefs.current[item.requirement_id] = el)}
                    onChange={(e) => handleFileChange(e, item.requirement_id)}
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                  />
                  
                  <button
                    disabled={uploadingId === item.requirement_id || item.status === 'pending'}
                    onClick={() => handleFileUploadClick(item.requirement_id)}
                    className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center transition-all ${
                      item.status === 'valid'
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/10'
                    }`}
                  >
                    {uploadingId === item.requirement_id || item.status === 'pending' ? (
                      <>
                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5 mr-2" />
                        {item.status === 'valid' ? 'Re-upload' : 'Upload document'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Reference Guides Accordion (Right Pane) */}
          <div className="space-y-6">
            
            {/* Next Steps List */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Next Steps Checklist</h3>
              <ul className="space-y-2 text-xs">
                {checklistData?.next_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-slate-400">
                    <span className="h-4 w-4 bg-slate-800 text-blue-400 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">{idx + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Application Steps Accordion */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">How to Apply</h3>
              <div className="space-y-1.5">
                {serviceDetails?.application_steps.map((step: any) => {
                  const isExpanded = expandedStep === step.id;
                  return (
                    <div key={step.id} className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-900/30 transition-colors"
                      >
                        <span className="text-xs font-semibold text-slate-200">
                          {step.step_number}. {step.step_title}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase font-medium">
                            {step.is_online ? 'online' : 'offline'}
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3 text-xs text-slate-400 border-t border-slate-900 pt-2 leading-relaxed">
                          {step.step_description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">Frequently Asked Questions</h3>
              <div className="space-y-1.5">
                {serviceDetails?.faqs.map((faq: any) => {
                  const isExpanded = expandedFAQ === faq.id;
                  return (
                    <div key={faq.id} className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
                      <button
                        onClick={() => setExpandedFAQ(isExpanded ? null : faq.id)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-900/30 transition-colors"
                      >
                        <span className="text-xs font-semibold text-slate-200">{faq.question}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3 text-xs text-slate-400 border-t border-slate-900 pt-2 leading-relaxed">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Common Rejections */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">Common Rejection Warnings</h3>
              <div className="space-y-2">
                {serviceDetails?.rejection_reasons.map((rej: any) => (
                  <div key={rej.id} className="p-3 bg-red-950/10 border border-red-950/45 rounded-xl space-y-1.5">
                    <h4 className="text-xs font-bold text-red-400 flex items-center">
                      <AlertCircle className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                      {rej.reason_title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{rej.reason_description}</p>
                    <p className="text-[10px] text-slate-500 leading-none"><span className="font-semibold text-emerald-500/80">Mitigation:</span> {rej.mitigation_steps}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Right Pane - Collapsible Context-Aware Chat Assistant */}
      <div className="w-[350px] border-l border-slate-800 bg-slate-950/30 flex flex-col h-full">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-2.5">
          <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">Verification Chatbot</h3>
            <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Context-Aware Gemini Assistant</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <MessageSquare className="h-10 w-10 text-slate-700 mb-2 animate-bounce" />
              <p className="text-xs text-slate-400 font-semibold">Ask me anything about your {checklistData?.service_name} requirements!</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">I can help check name spellings, address parameters, and explain checklist statuses.</p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none leading-relaxed'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {sendingMsg && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center space-x-1">
                <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/50 flex space-x-2">
          <input
            type="text"
            placeholder="Ask question..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || sendingMsg}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};
