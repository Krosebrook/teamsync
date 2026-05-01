import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from './components/AppLayout';

import SimulationPage from './pages/Simulation';
import Dashboard from './pages/Dashboard';
import TemplatesPage from './pages/Templates';
import PlaybooksPage from './pages/Playbooks';
import TeamPage from './pages/Team';
import SettingsPage from './pages/Settings';
import WebhooksPage from './pages/Webhooks';

// Legacy pages kept accessible
import Analytics from './pages/Analytics';
import AnalyticsNew from './pages/AnalyticsNew';

const Wrap = ({ children }) => <AppLayout>{children}</AppLayout>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/" element={<Wrap><Dashboard /></Wrap>} />
      <Route path="/Dashboard" element={<Wrap><Dashboard /></Wrap>} />
      <Route path="/Simulation" element={<Wrap><SimulationPage /></Wrap>} />
      <Route path="/Templates" element={<Wrap><TemplatesPage /></Wrap>} />
      <Route path="/Playbooks" element={<Wrap><PlaybooksPage /></Wrap>} />
      <Route path="/Team" element={<Wrap><TeamPage /></Wrap>} />
      <Route path="/Settings" element={<Wrap><SettingsPage /></Wrap>} />
      <Route path="/Webhooks" element={<Wrap><WebhooksPage /></Wrap>} />
      <Route path="/Analytics" element={<Wrap><Analytics /></Wrap>} />
      <Route path="/AnalyticsNew" element={<Wrap><AnalyticsNew /></Wrap>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;