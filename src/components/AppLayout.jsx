import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Users, Settings, Zap } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Templates', path: '/Templates', icon: FileText },
  { label: 'Playbooks', path: '/Playbooks', icon: BookOpen },
  { label: 'Team', path: '/Team', icon: Users },
  { label: 'Settings', path: '/Settings', icon: Settings },
];

export default function AppLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-slate-800 flex items-center justify-center rounded">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900">TeamSync</span>
          </div>

          <nav aria-label="Main navigation" className="flex items-center gap-0.5">
            {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
              const active = path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                    active
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}