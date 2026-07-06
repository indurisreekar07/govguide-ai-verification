import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Landing } from './pages/Landing';
import { ServiceSearch } from './pages/ServiceSearch';

const AppContent: React.FC = () => {
  const { user, loading, apiFetch } = useAuth();
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  
  // Dashboard & Navigation State
  const [activeAppId, setActiveAppId] = useState<number | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [applications, setApplications] = useState<any[]>([]);

  const handleRefreshSidebar = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const loadApplications = async () => {
    try {
      const data = await apiFetch('api/v1/applications');
      setApplications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user, refreshTrigger]);

  const handleStartApplication = async (serviceId: number) => {
    const newApp = await apiFetch('api/v1/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service_id: serviceId }),
    });
    handleRefreshSidebar();
    setActiveAppId(newApp.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400 font-semibold">Loading GovGuide AI workspace...</p>
        </div>
      </div>
    );
  }

  // Not logged in: Render Auth forms
  if (!user) {
    if (authView === 'landing') {
      return <Landing onStart={(view) => setAuthView(view)} />;
    }
    return authView === 'login' 
      ? <Login onSwitchToRegister={() => setAuthView('register')} onBackToLanding={() => setAuthView('landing')} />
      : <Register onSwitchToLogin={() => setAuthView('login')} onBackToLanding={() => setAuthView('landing')} />;
  }

  // Logged in: Render Core Application Workspace
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden">
      <Navbar 
        onAdminToggle={() => setShowAdmin(!showAdmin)} 
        showAdmin={showAdmin} 
      />

      <div className="flex-1 flex overflow-hidden">
        {showAdmin ? (
          // Admin View: Services configuration
          <Admin />
        ) : (
          // User View: Sidebar + Active Dashboard pane
          <>
            <Sidebar 
              onSelectApplication={(id) => setActiveAppId(id)}
              activeAppId={activeAppId}
              refreshTrigger={refreshTrigger}
            />

            {activeAppId ? (
              <Dashboard 
                applicationId={activeAppId} 
                onRefreshSidebar={handleRefreshSidebar}
              />
            ) : (
              <ServiceSearch 
                onStartApplication={handleStartApplication}
                applications={applications}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
