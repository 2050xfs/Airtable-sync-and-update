
import React, { useState, useEffect, useRef } from 'react';
import { ConnectForm } from './components/ConnectForm';
import { DataTable } from './components/DataTable';
import { ProcessingPanel } from './components/ProcessingPanel';
import { PendingDrawer } from './components/PendingDrawer';
import { AirtableConfig, AirtableRecord, ProcessingConfig, ProcessingStatus, ProcessMode } from './types';
import { AirtableService } from './services/airtableService';
import { GeminiService } from './services/geminiService';
import { Layers, Database, Sparkles, LogOut, ChevronRight, CheckCircle2, AlertCircle, Cpu, Terminal, Zap, Image as ImageIcon, RotateCw, Send, Check, Fingerprint, ShieldCheck, SearchCheck, Inbox, DatabaseZap } from 'lucide-react';

const STORAGE_KEY = 'airgen_studio_config';

const App: React.FC = () => {
  const [atConfig, setAtConfig] = useState<AirtableConfig | null>(null);
  const [records, setRecords] = useState<AirtableRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeConfig, setActiveConfig] = useState<ProcessingConfig | null>(null);
  const [processStep, setProcessStep] = useState<'scan' | 'generate' | 'verify'>('scan');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>({
    total: 0,
    current: 0,
    completed: 0,
    failed: 0,
    isProcessing: false,
    logs: [],
    currentResult: '',
    pendingUpdates: {}
  });

  const logEndRef = useRef<HTMLDivElement>(null);
  const geminiService = new GeminiService();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        handleConnect(parsed, true); 
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [status.logs]);

  const addLog = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatus(prev => ({
      ...prev,
      logs: [...prev.logs, { id: Math.random().toString(), message, status: type }]
    }));
  };

  const handleConnect = async (config: AirtableConfig, isAuto: boolean = false) => {
    setIsLoading(true);
    setError(null);
    const cleanConfig = {
      apiKey: config.apiKey.trim(),
      baseId: config.baseId.trim(),
      tableName: config.tableName.trim()
    };
    const service = new AirtableService(cleanConfig);
    try {
      const fetchedRecords = await service.fetchRecords(50);
      setRecords(fetchedRecords);
      setAtConfig(cleanConfig);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanConfig));
      if (!isAuto) addLog('Curatorial archive synchronized.', 'success');
    } catch (err: any) {
      setError(isAuto ? null : err.message);
      if (isAuto) localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setAtConfig(null);
    setRecords([]);
    localStorage.removeItem(STORAGE_KEY);
    setError(null);
  };

  const handleProcess = async (config: ProcessingConfig) => {
    if (!atConfig) return;
    setActiveConfig(config);
    
    setStatus(prev => ({
      ...prev,
      total: records.length,
      current: 0,
      completed: 0,
      failed: 0,
      isProcessing: true,
      logs: [{ id: 'init', message: 'Initiating curatorial research cycle...', status: 'info' }],
      currentResult: '',
      pendingUpdates: {}
    }));

    for (const [index, record] of records.entries()) {
      setStatus(prev => ({ ...prev, current: index + 1, currentResult: '' }));
      
      setProcessStep('scan');
      addLog(`Analyzing form & material: ${record.id.slice(-4)}...`, 'info');
      await new Promise(r => setTimeout(r, 800));

      setProcessStep('generate');
      try {
        let finalPrompt = config.promptTemplate;
        Object.keys(record.fields).forEach(key => {
          const val = record.fields[key] || '';
          finalPrompt = finalPrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
        });

        let result = { text: '', sources: [] };
        if (config.mode === ProcessMode.ANALYZE_IMAGE) {
          const imageValue = record.fields[config.imageField];
          const firstImage = Array.isArray(imageValue) ? imageValue[0]?.url : null;
          if (firstImage) {
            result = await geminiService.analyzeImage(firstImage, finalPrompt);
          } else {
             addLog(`No visual data for ${record.id.slice(-4)}`, 'error');
             setStatus(prev => ({ ...prev, failed: prev.failed + 1 }));
             continue;
          }
        } else {
          result = await geminiService.generateText(finalPrompt);
        }

        if (result.text) {
          setStatus(prev => ({ ...prev, currentResult: result.text }));
          
          setProcessStep('verify');
          addLog(`Contextualizing through ${result.sources.length} cultural citations...`, 'info');
          await new Promise(r => setTimeout(r, 1200)); 

          setStatus(prev => ({ 
            ...prev, 
            completed: prev.completed + 1,
            pendingUpdates: { ...prev.pendingUpdates, [record.id]: { text: result.text, sources: result.sources } }
          }));
          addLog(`Refined description ready for ${record.id.slice(-4)}`, 'success');
        }
      } catch (err: any) {
        addLog(`Archive research error: ${err.message}`, 'error');
        setStatus(prev => ({ ...prev, failed: prev.failed + 1, currentResult: 'Synthesis failed.' }));
      }
      
      await new Promise(r => setTimeout(r, 800));
    }
    
    setStatus(prev => ({ ...prev, isProcessing: false }));
    addLog('Batch curation complete. Review the narrative drafts.', 'success');
    if (Object.keys(status.pendingUpdates).length > 0) setIsDrawerOpen(true);
  };

  const handleCommitRecord = async (recordId: string) => {
    if (!atConfig || !activeConfig) return;
    const content = status.pendingUpdates[recordId]?.text;
    if (!content) return;

    const atService = new AirtableService(atConfig);
    try {
      await atService.updateRecord(recordId, { [activeConfig.outputField]: content });
      setRecords(prev => prev.map(r => r.id === recordId ? {
        ...r, fields: { ...r.fields, [activeConfig.outputField]: content }
      } : r));
      setStatus(prev => {
        const next = { ...prev.pendingUpdates };
        delete next[recordId];
        return { ...prev, pendingUpdates: next };
      });
      addLog(`Synchronized ${recordId.slice(-4)}`, 'success');
    } catch (err: any) {
      addLog(`Vault sync error: ${err.message}`, 'error');
    }
  };

  const handleCommitAll = async () => {
    const ids = Object.keys(status.pendingUpdates);
    for (const id of ids) await handleCommitRecord(id);
    addLog(`Curation phase finalized.`, 'success');
    setIsDrawerOpen(false);
  };

  const currentActiveRecord = records[status.current - 1];
  const pendingCount = Object.keys(status.pendingUpdates).length;

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden font-sans">
      <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0 z-[100] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-600/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight text-slate-800">AirGen <span className="text-blue-600 font-bold">Studio</span></span>
        </div>
        
        {atConfig && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 p-1 bg-slate-50 border border-slate-200 rounded-lg pr-3">
              <div className="bg-white border border-slate-200 p-1 rounded-md text-blue-600 shadow-sm">
                <Database className="w-3.5 h-3.5" />
              </div>
              <div className="flex gap-2 text-[11px] font-bold uppercase tracking-tighter">
                 <span className="text-slate-800 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{atConfig.tableName}</span>
                 <span className="text-slate-300 font-light self-center">|</span>
                 <span className="text-slate-400 font-mono self-center">{atConfig.baseId}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden p-6 flex gap-6 relative">
        {!atConfig ? (
          <div className="m-auto w-full max-w-lg">
             <ConnectForm onConnect={(cfg) => handleConnect(cfg)} isLoading={isLoading} />
             {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl text-center shadow-sm">{error}</div>}
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col gap-6 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Layers className="w-3 h-3" /> Curatorial Bench
                   </h2>
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-black uppercase">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      {status.isProcessing ? 'Research in Progress' : 'Archive Ready'}
                   </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {pendingCount > 0 && (
                    <button 
                      onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl ${
                        isDrawerOpen ? 'bg-white border border-slate-200 text-slate-800' : 'bg-slate-900 text-white shadow-slate-900/10'
                      }`}
                    >
                      <Inbox className="w-3 h-3" /> {isDrawerOpen ? 'Close Pipeline' : 'Review Research'} ({pendingCount})
                    </button>
                  )}
                  
                  {pendingCount > 0 && (
                    <button 
                      onClick={() => {
                        if (confirm(`Final step: Deploy ${pendingCount} updates to Airtable?`)) {
                           handleCommitAll();
                        }
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 border-2 border-white"
                    >
                      <DatabaseZap className="w-3.5 h-3.5" /> Push to Live Table
                    </button>
                  )}
                </div>
              </div>

              {status.isProcessing ? (
                <div className="flex-1 flex items-center justify-center bg-slate-100/30 rounded-[3rem] border-2 border-dashed border-slate-200 relative overflow-hidden">
                   <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                      <div className="w-[800px] h-[800px] bg-blue-500 rounded-full animate-pulse blur-3xl" />
                   </div>

                   <div className="w-full max-w-4xl bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-700 relative z-10">
                      <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                         <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl transition-colors ${processStep === 'generate' ? 'bg-blue-600 text-white animate-spin' : 'bg-blue-50 text-blue-600'}`}>
                               <Cpu className="w-5 h-5" />
                            </div>
                            <div>
                               <h3 className="text-sm font-black text-slate-800">Curation: Record {status.current} of {status.total}</h3>
                               <div className="flex gap-4 mt-0.5">
                                  <div className={`text-[9px] font-black uppercase flex items-center gap-1.5 ${processStep === 'scan' ? 'text-blue-600' : 'text-slate-300'}`}>
                                     <Fingerprint className="w-3 h-3" /> Grounding
                                  </div>
                                  <ChevronRight className="w-3 h-3 text-slate-200" />
                                  <div className={`text-[9px] font-black uppercase flex items-center gap-1.5 ${processStep === 'generate' ? 'text-blue-600' : 'text-slate-300'}`}>
                                     <Sparkles className="w-3 h-3" /> Synthesis
                                  </div>
                                  <ChevronRight className="w-3 h-3 text-slate-200" />
                                  <div className={`text-[9px] font-black uppercase flex items-center gap-1.5 ${processStep === 'verify' ? 'text-blue-600' : 'text-slate-300'}`}>
                                     <SearchCheck className="w-3 h-3" /> Fact Check
                                  </div>
                               </div>
                            </div>
                         </div>
                         <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm text-[10px] font-mono font-bold text-slate-500">
                            ID: {currentActiveRecord?.id}
                         </div>
                      </div>

                      <div className="p-10 flex gap-10 min-h-[400px]">
                         <div className="w-1/3 space-y-6">
                            <div className="aspect-square bg-slate-50 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden relative group">
                               {currentActiveRecord?.fields[Object.keys(currentActiveRecord.fields).find(k => Array.isArray(currentActiveRecord.fields[k])) || '']?.[0]?.url ? (
                                 <img src={currentActiveRecord.fields[Object.keys(currentActiveRecord.fields).find(k => Array.isArray(currentActiveRecord.fields[k])) || ''][0].url} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="Scanning" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-200">
                                    <ImageIcon className="w-16 h-16 opacity-40" />
                                 </div>
                               )}
                               {processStep === 'scan' && (
                                 <div className="absolute inset-x-0 h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[scan_2s_ease-in-out_infinite] top-0 z-20" style={{'--tw-shadow-color': 'rgba(59,130,246,0.5)'}} />
                               )}
                            </div>

                            <div className="space-y-3">
                               <div className="flex items-center gap-2 px-2">
                                  <div className="w-1 h-3 bg-blue-600 rounded-full" />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Heritage Context</span>
                               </div>
                               <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-4 space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                                  {Object.entries(currentActiveRecord?.fields || {}).map(([k, v]) => typeof v !== 'object' && (
                                    <div key={k} className="flex justify-between gap-4 text-[10px] border-b border-slate-100 pb-1.5 last:border-0">
                                      <span className="text-slate-400 font-bold truncate">{k}</span>
                                      <span className="text-slate-800 font-medium truncate max-w-[120px]">{String(v)}</span>
                                    </div>
                                  ))}
                               </div>
                            </div>
                         </div>

                         <div className="flex-1 flex flex-col gap-4 relative">
                            {processStep === 'verify' && (
                               <div className="absolute -top-3 -right-3 z-30 animate-in bounce-in duration-500">
                                  <div className="bg-emerald-500 text-white p-2.5 rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center gap-2">
                                     <ShieldCheck className="w-5 h-5" />
                                     <span className="text-[10px] font-black uppercase tracking-widest pr-1">Verified Narrative</span>
                                  </div>
                               </div>
                            )}

                            <label className="text-[10px] font-black text-slate-400 uppercase px-2 flex items-center justify-between">
                               <span><Sparkles className="w-3 h-3 text-blue-600 inline mr-1" /> Artistic Enriched Description</span>
                               <span className="font-mono text-blue-500/50 animate-pulse">RESEARCH_FEED_ON</span>
                            </label>

                            <div className={`flex-1 bg-white rounded-3xl border-2 transition-all duration-500 p-8 text-slate-700 leading-relaxed overflow-y-auto shadow-inner ${processStep === 'verify' ? 'border-emerald-500/30 bg-emerald-50/5' : 'border-slate-100'}`}>
                               {status.currentResult ? (
                                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 font-medium text-sm italic">
                                     {status.currentResult}
                                  </div>
                               ) : (
                                  <div className="h-full flex flex-col items-center justify-center gap-6 opacity-30">
                                     <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse" />
                                     <span className="text-[10px] font-black uppercase tracking-[0.3em]">Culling Historical Citations</span>
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex-1 relative bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    <DataTable 
                      records={records} 
                      pendingUpdates={status.pendingUpdates} 
                      onCommit={handleCommitRecord}
                    />
                  </div>
                </div>
              )}

              <div className="h-32 bg-white rounded-[2rem] border border-slate-200 p-6 flex gap-10 shrink-0 shadow-xl shadow-slate-200/20 border-b-4 border-b-blue-600">
                <div className="w-64 border-r border-slate-100 pr-10 flex flex-col justify-center">
                   <div className="flex justify-between items-end mb-2.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archive Flow</span>
                      <span className="text-2xl font-black text-slate-800 tabular-nums tracking-tighter">
                        {status.completed}<span className="text-slate-200 text-lg font-black mx-1">/</span><span className="text-slate-400 text-lg">{status.total}</span>
                      </span>
                   </div>
                   <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-600/30" 
                        style={{ width: `${(status.total > 0 ? (status.completed + status.failed) / status.total : 0) * 100}%` }}
                      />
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 custom-scrollbar pr-4 py-1">
                   {status.logs.length === 0 && <div className="h-full flex items-center justify-center text-slate-200 italic uppercase font-black tracking-[0.5em]">Awaiting Data Feed</div>}
                   {status.logs.map(log => (
                     <div key={log.id} className="flex gap-4 items-baseline group border-l-2 border-transparent hover:border-blue-100 pl-3 transition-colors">
                        <span className="text-slate-300 shrink-0 tabular-nums font-bold">[{new Date().toLocaleTimeString([], {hour12:false})}]</span>
                        <span className={`font-bold tracking-tight ${log.status === 'error' ? 'text-red-500' : log.status === 'success' ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {log.message}
                        </span>
                     </div>
                   ))}
                   <div ref={logEndRef} />
                </div>
              </div>
            </div>

            <aside className="w-[480px] shrink-0 animate-in slide-in-from-right-8 duration-700">
               <ProcessingPanel 
                  records={records}
                  onProcess={handleProcess}
                  status={status}
               />
            </aside>
          </>
        )}
      </main>

      <PendingDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(!isDrawerOpen)}
        records={records}
        pendingUpdates={status.pendingUpdates}
        onCommit={handleCommitRecord}
        onCommitAll={handleCommitAll}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}} />
    </div>
  );
};

export default App;
