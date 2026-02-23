
import React from 'react';
import { AirtableRecord, ProcessingStatus } from '../types';
import { 
  X, 
  CheckCircle2, 
  Send, 
  ImageIcon, 
  FileText, 
  ChevronUp, 
  ChevronDown, 
  ExternalLink, 
  ShieldCheck, 
  Download, 
  AlertTriangle,
  DatabaseZap
} from 'lucide-react';

interface PendingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  records: AirtableRecord[];
  pendingUpdates: ProcessingStatus['pendingUpdates'];
  onCommit: (recordId: string) => void;
  onCommitAll: () => void;
}

export const PendingDrawer: React.FC<PendingDrawerProps> = ({ 
  isOpen, 
  onClose, 
  records, 
  pendingUpdates, 
  onCommit,
  onCommitAll
}) => {
  const pendingRecords = records.filter(r => !!pendingUpdates[r.id]);
  const count = pendingRecords.length;

  const downloadCSV = () => {
    if (count === 0) return;
    
    const headers = ['Record ID', 'Original Description', 'AI Verified Description', 'Sources'];
    const rows = pendingRecords.map(record => {
      const draft = pendingUpdates[record.id];
      const original = record.fields['Description'] || '';
      const sources = draft.sources.map(s => s.uri).join('; ');
      return [
        record.id,
        `"${String(original).replace(/"/g, '""')}"`,
        `"${draft.text.replace(/"/g, '""')}"`,
        `"${sources.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `airgen_batch_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen && count === 0) return null;

  return (
    <div 
      className={`fixed inset-x-0 bottom-0 z-[150] transition-transform duration-500 ease-in-out transform ${
        isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'
      }`}
    >
      {/* Drawer Header / Handle */}
      <div 
        onClick={onClose}
        className="bg-white border-t border-x border-slate-200 rounded-t-[2.5rem] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.15)] h-12 flex items-center justify-between px-10 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
            Pending Fact-Check Queue ({count})
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-1 w-12 bg-slate-200 rounded-full" />
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Drawer Content */}
      <div className="bg-white border-x border-slate-200 h-[500px] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-10 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Review & Deploy</span>
             </div>
             <p className="text-[11px] text-slate-500">Cross-examine the research before pushing to the live database.</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); downloadCSV(); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>

            <div className="h-8 w-px bg-slate-200 mx-2" />

            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (confirm(`Are you sure you want to push ${count} records to Airtable? This action will overwrite existing data.`)) {
                  onCommitAll(); 
                }
              }}
              className="flex items-center gap-3 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-95 border border-slate-700 group"
            >
              <DatabaseZap className="w-4 h-4 text-blue-400 group-hover:animate-pulse" /> Push to Live Airtable
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto p-8 flex gap-8 custom-scrollbar bg-slate-100/20">
          {pendingRecords.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center text-slate-300 gap-4">
              <CheckCircle2 className="w-16 h-16 opacity-10" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Queue Processed</span>
            </div>
          ) : (
            pendingRecords.map(record => {
              const draft = pendingUpdates[record.id];
              const imageField = Object.keys(record.fields).find(k => Array.isArray(record.fields[k]) && record.fields[k][0]?.url);
              const imageUrl = imageField ? record.fields[imageField][0].url : null;

              return (
                <div 
                  key={record.id} 
                  className="w-[420px] shrink-0 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group/card"
                >
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white group-hover/card:bg-slate-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">ID: {record.id.slice(-8)}</span>
                      <span className="text-[9px] font-black text-blue-600 uppercase mt-0.5">Verified Draft</span>
                    </div>
                    <button 
                      onClick={() => onCommit(record.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    {imageUrl && (
                      <div className="aspect-video bg-slate-100 rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-inner group-hover/card:scale-[1.02] transition-transform duration-500">
                        <img src={imageUrl} className="w-full h-full object-cover" alt="context" />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> Narrative Narrative
                      </label>
                      <div className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/50 p-5 rounded-2xl border border-slate-100 whitespace-pre-wrap selection:bg-blue-100">
                        {draft.text}
                      </div>
                    </div>

                    {draft.sources.length > 0 && (
                      <div className="space-y-3 pb-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Research Sources</label>
                        <div className="grid grid-cols-1 gap-2">
                           {draft.sources.map((source, idx) => (
                             <a 
                               key={idx}
                               href={source.uri}
                               target="_blank"
                               rel="noreferrer"
                               className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 hover:text-blue-600 transition-all shadow-sm group/link"
                             >
                               <ExternalLink className="w-3 h-3 shrink-0 opacity-40 group-hover/link:opacity-100" />
                               <span className="truncate flex-1 font-bold">{source.title || source.uri}</span>
                             </a>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
