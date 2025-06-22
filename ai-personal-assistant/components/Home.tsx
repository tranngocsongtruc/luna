
import React from 'react';
import { Link } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';

export const Home: React.FC = () => {
  return (
    <div className="text-center">
      <header className="my-10">
        <h1 className="text-5xl font-extrabold text-sky-400">
          Welcome to Your AI Personal Assistant
        </h1>
        <p className="mt-4 text-xl text-slate-300 max-w-2xl mx-auto">
          Your intelligent companion for enhanced productivity and understanding. Explore the features below.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {NAV_ITEMS.map((feature) => (
          <Link
            key={feature.path}
            to={feature.path}
            className="block p-6 bg-slate-800 hover:bg-slate-700/80 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <i className={`${feature.icon} text-4xl text-sky-400 mb-4`}></i>
              <h2 className="text-xl font-semibold text-white mb-2">{feature.name}</h2>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </div>
          </Link>
        ))}
      </div>
       <section className="my-12 p-8 bg-slate-800 rounded-lg shadow-xl">
        <h2 className="text-3xl font-semibold text-sky-400 mb-4">How it Works</h2>
        <p className="text-slate-300 leading-relaxed max-w-3xl mx-auto">
          This AI Personal Assistant leverages the power of Google's Gemini models to provide intelligent responses and assistance. 
          Simply choose a feature, provide your input, and let the AI help you. Your interactions are processed securely, 
          and your API key (if applicable for self-hosting) is managed via environment variables for safety.
          Personal information for features like Resource Finder is used only for the current session to generate relevant results and is not stored.
        </p>
      </section>
    </div>
  );
};
