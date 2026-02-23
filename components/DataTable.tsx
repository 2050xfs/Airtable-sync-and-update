
import React from 'react';
import { AirtableRecord, ProcessingStatus } from '../types';
import { Image as ImageIcon, FileText, CheckCircle2, RotateCw, ExternalLink, ShieldCheck } from 'lucide-react';

interface DataTableProps {
  records: AirtableRecord[];
  pendingUpdates: ProcessingStatus['pendingUpdates'];
  onCommit: (recordId: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ records, pendingUpdates, onCommit }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
        Dataset is empty. Refresh to populate.
      </div>
    );
  }

  const allKeys: string[] = Array.from(new Set(records.flatMap(r => Object.keys(r.fields))));

  return (
    <div className="w-full h-full overflow-auto rounded-xl border-none bg-white custom-scrollbar">
      <table className="w-full text-sm text-left text-slate-600 border-collapse">
        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/80 sticky top-0 z-10 border-b border-slate-100 font-black tracking-widest">
          <tr>
            <th className="px-6 py-4 whitespace-nowrap bg-slate-50/80">Action</th>
            <th className="px-6 py-4 whitespace-nowrap bg-slate-50/80">Status</th>
            <th className="px-6 py-4 whitespace-nowrap bg-slate-50/80">ID</th>
            {allKeys.map(key => (
              <th key={key} className="px-6 py-4 whitespace-nowrap bg-slate-50/80 font-black">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {records.map((record) => {
            const draft = pendingUpdates[record.id];
            return (
              <tr key={record.id} className={`hover:bg-slate-50/50 transition-colors group ${draft ? 'bg-blue-50/30' : ''}`}>
                <td className="px-6 py-4">
                  {draft ? (
                    <button 
                      onClick={() => onCommit(record.id)}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all shadow-md shadow-blue-600/20 active:scale-95 flex items-center gap-1.5 text-[9px] font-black uppercase"
                      title="Commit this fact-checked draft"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                  ) : (
                    <div className="p-1.5 text-slate-300 opacity-20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   {draft ? (
                     <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase flex items-center gap-1 w-fit">
                        <ShieldCheck className="w-2.5 h-2.5" /> Fact Checked
                     </span>
                   ) : (
                     <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[9px] font-black uppercase w-fit">Synced</span>
                   )}
                </td>
                <td className="px-6 py-4 font-mono text-[10px] text-slate-400 group-hover:text-slate-600">
                  {record.id.slice(-6)}
                </td>
                {allKeys.map((key) => {
                  const value = record.fields[key];
                  return (
                    <td key={`${record.id}-${key}`} className="px-6 py-4 max-w-sm">
                      <div className="relative">
                        {draft && (key === 'Description' || key === 'Description (draft)') ? (
                          <div className="space-y-2">
                             <div className="line-through opacity-30 text-xs italic"><CellContent value={value} /></div>
                             <div className="text-xs font-bold text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-1 duration-500">
                                {draft.text}
                             </div>
                          </div>
                        ) : (
                          <CellContent value={value} />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const CellContent: React.FC<{ value: any }> = ({ value }) => {
  if (value === undefined || value === null || value === '') return <span className="text-slate-300 italic">-</span>;

  if (Array.isArray(value) && value[0]?.url) {
    return (
      <div className="flex -space-x-1.5 overflow-hidden p-1">
        {value.map((attachment: any, i: number) => (
           <a 
             key={i} 
             href={attachment.url} 
             target="_blank" 
             rel="noreferrer"
             className="relative z-10 block w-10 h-10 rounded-xl ring-2 ring-white overflow-hidden hover:z-20 hover:scale-125 transition-all shadow-sm"
             title={attachment.filename}
           >
             {attachment.type?.startsWith('image') ? (
               <img src={attachment.thumbnails?.small?.url || attachment.url} alt="att" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                 <FileText className="w-4 h-4 text-slate-400" />
               </div>
             )}
           </a>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    return <span className="text-[10px] font-mono text-slate-400 truncate block max-w-[200px]">{JSON.stringify(value)}</span>;
  }

  const str = String(value);
  return <span className={`text-xs text-slate-700 leading-relaxed ${str.length > 100 ? 'line-clamp-3' : ''}`}>{str}</span>;
};
