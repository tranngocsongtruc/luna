
import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home } from './components/Home';
import { ContextExplainer } from './features/ContextExplainer';
import { NoteTaker } from './features/NoteTaker';
import { ResourceFinder } from './features/ResourceFinder';
import { EducationalAssistant } from './features/EducationalAssistant';
import { EmergencyCaller } from './features/EmergencyCaller';
import { Scheduler } from './features/Scheduler';
import { NAV_ITEMS } from './constants';
import { NavItem } from './types'; // Changed from AssistantFeature

const App: React.FC = () => {
  const location = useLocation();

  const getFeatureByPath = (path: string): NavItem | undefined => { // Changed from AssistantFeature
    return NAV_ITEMS.find(item => item.path === path);
  };

  const currentFeature: NavItem | undefined = getFeatureByPath(location.pathname); // Changed from AssistantFeature
  const pageTitle = currentFeature ? currentFeature.name : "AI Personal Assistant";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100">
      <nav className="bg-slate-900/80 backdrop-blur-md shadow-lg p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-sky-400 hover:text-sky-300 transition-colors">
            <i className="fas fa-brain mr-2"></i>AI Assistant
          </Link>
          <div className="space-x-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out
                            ${location.pathname === item.path
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
              >
                <i className={`${item.icon} mr-2`}></i>{item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto p-6">
        {location.pathname !== "/" && (
            <h1 className="text-3xl font-semibold mb-6 text-sky-400 border-b-2 border-sky-500/30 pb-2">
              {pageTitle}
            </h1>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/context" element={<ContextExplainer />} />
          <Route path="/notes" element={<NoteTaker />} />
          <Route path="/resources" element={<ResourceFinder />} />
          <Route path="/education" element={<EducationalAssistant />} />
          <Route path="/emergency" element={<EmergencyCaller />} />
          <Route path="/schedule" element={<Scheduler />} />
        </Routes>
      </main>

      <footer className="bg-slate-900/80 text-center p-4 text-sm text-slate-400">
        © {new Date().getFullYear()} AI Personal Assistant. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
