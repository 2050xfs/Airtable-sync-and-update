
import React, { useState } from 'react';
import { AirtableConfig } from '../types';
// Add RotateCw to the imported icons
import { Database, ArrowRight, ShieldCheck, RotateCw } from 'lucide-react';

interface ConnectFormProps {
  onConnect: (config: AirtableConfig) => void;
  isLoading: boolean;
}

export const ConnectForm: React.FC<ConnectFormProps> = ({ onConnect, isLoading }) => {
  const [config, setConfig] = useState<AirtableConfig>({
    apiKey: '',
    baseId: '',
    tableName: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(config);
  };

  return (
    <div className="w-full max-w-md mx-auto p-10 rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/50">
      <div className="flex flex-col items-center text-center gap-4 mb-8">
        <div className="p-4 bg-blue-50 rounded-2xl">
          <Database className="w-10 h-10 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Connect Airtable</h2>
          <p className="text-slate-500 text-sm mt-1">Sync your database with Gemini Vision</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Access Token
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
              placeholder="pat.xxxxxxxx..."
            />
            <ShieldCheck className="absolute right-4 top-4 w-5 h-5 text-slate-300" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Base ID
            </label>
            <input
              type="text"
              required
              value={config.baseId}
              onChange={(e) => setConfig({ ...config, baseId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
              placeholder="appXXXXXXXXXXXXXX"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Table Name
            </label>
            <input
              type="text"
              required
              value={config.tableName}
              onChange={(e) => setConfig({ ...config, tableName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
              placeholder="Inventory"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
               <RotateCw className="w-5 h-5 animate-spin" />
               <span>Connecting...</span>
            </div>
          ) : (
            <>
              Authorize Link <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
