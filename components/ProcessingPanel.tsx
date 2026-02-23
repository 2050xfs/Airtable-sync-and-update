
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { AirtableRecord, ProcessingConfig, ProcessMode, ProcessingStatus, WORKFLOW_TEMPLATES, WorkflowTemplate } from '../types';
import { Play, RotateCw, Settings2, Image as ImageIcon, Type, Sparkles, Check, Info, Package, ShieldAlert, Search } from 'lucide-react';

const IconMap: Record<string, any> = { Package, ShieldAlert, Search };

interface ProcessingPanelProps {
  records: AirtableRecord[];
  onProcess: (config: ProcessingConfig) => void;
  status: ProcessingStatus;
}

export const ProcessingPanel: React.FC<ProcessingPanelProps> = ({ records, onProcess, status }) => {
  const [config, setConfig] = useState<ProcessingConfig>({
    mode: ProcessMode.ANALYZE_IMAGE,
    imageField: '',
    textFields: [],
    outputField: 'Description',
    promptTemplate: ''
  });

  const availableFields: string[] = Array.from(new Set(records.flatMap(r => Object.keys(r.fields))));
  
  const possibleImageFields = availableFields.filter(f => 
    records.some(r => Array.isArray(r.fields[f]) && (r.fields[f] as any)[0]?.url)
  );

  useEffect(() => {
    if (availableFields.length > 0) {
      setConfig(prev => ({ 
        ...prev, 
        imageField: prev.imageField || possibleImageFields[0] || '',
      }));
    }
  }, [availableFields]);

  const applyTemplate = (t: WorkflowTemplate) => {
    setConfig(prev => ({
      ...prev,
      mode: t.mode,
      promptTemplate: t.prompt
    }));
  };

  const toggleTextField = (field: string) => {
    setConfig(prev => ({
      ...prev,
      textFields: prev.textFields.includes(field) 
        ? prev.textFields.filter(f => f !== field)
        : [...prev.textFields, field]
    }));
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-4">
      {/* Blueprint Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
           <Sparkles className="w-3.5 h-3.5 text-blue-600" />
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blueprints</h3>
        </div>
        <div className="space-y-3">
          {WORKFLOW_TEMPLATES.map((template: WorkflowTemplate) => {
            const Icon = IconMap[template.icon as string];
            return (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 transition-all group shadow-sm flex items-center gap-4"
              >
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 tracking-tight">{template.name}</div>
                  <div className="text-[11px] text-slate-400">{template.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Mapping Studio Section */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2">
             <Settings2 className="w-4 h-4 text-blue-600" />
             <h3 className="text-sm font-black text-slate-800">Mapping Studio</h3>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
               onClick={() => setConfig({...config, mode: ProcessMode.ANALYZE_IMAGE})} 
               className={`p-1.5 rounded-md transition-all ${config.mode === ProcessMode.ANALYZE_IMAGE ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
             >
                <ImageIcon className="w-3.5 h-3.5" />
             </button>
             <button 
               onClick={() => setConfig({...config, mode: ProcessMode.GENERATE_CONTENT})} 
               className={`p-1.5 rounded-md transition-all ${config.mode === ProcessMode.GENERATE_CONTENT ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
             >
                <Type className="w-3.5 h-3.5" />
             </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Image Source */}
          {config.mode === ProcessMode.ANALYZE_IMAGE && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                 <ImageIcon className="w-3 h-3" /> Image Source
              </label>
              <select
                value={config.imageField}
                onChange={(e) => setConfig({ ...config, imageField: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 hover:border-slate-300 transition-all appearance-none cursor-pointer"
              >
                <option value="">Select Attachment Field...</option>
                {possibleImageFields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}

          {/* Input Context (Tags) */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
               <Type className="w-3 h-3" /> Input Context
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
               {availableFields.map((f: string) => (
                 <button
                   key={f}
                   onClick={() => toggleTextField(f)}
                   className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                     config.textFields.includes(f) 
                     ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20' 
                     : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                   }`}
                 >
                   {f}
                 </button>
               ))}
            </div>
          </div>

          {/* Output Column */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase block">Output Column (Update)</label>
            <input
              type="text"
              value={config.outputField}
              onChange={(e) => setConfig({ ...config, outputField: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-bold outline-none focus:border-blue-500 transition-all"
              placeholder="e.g. Description"
            />
          </div>

          {/* AI Instruction */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase block">AI Instruction</label>
            <textarea
              value={config.promptTemplate}
              onChange={(e) => setConfig({ ...config, promptTemplate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 outline-none focus:border-blue-500 min-h-[140px] resize-none leading-relaxed transition-all"
              placeholder="Tell Gemini what to do. Use {ColumnName} to inject row values..."
            />
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={() => onProcess(config)}
          disabled={status.isProcessing || !config.promptTemplate || !config.outputField}
          className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-lg ${
            status.isProcessing
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-blue-600/20'
          }`}
        >
          {status.isProcessing ? (
            <RotateCw className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          {status.isProcessing ? 'SYNCHRONIZING...' : 'Run Update'}
        </button>
      </section>
    </div>
  );
};
