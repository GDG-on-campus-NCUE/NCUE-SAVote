import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { type Election, ElectionType } from '@savote/shared-types';
import { Button } from '../../../components/m3/Button';
import { FileText, ExternalLink, Info, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

export const ELECTION_TYPE_LABELS: Record<string, string> = {
  [ElectionType.PRESIDENTIAL]: '正副會長選舉',
  [ElectionType.DISTRICT_COUNCILOR]: '選區議員選舉',
  [ElectionType.AT_LARGE_COUNCILOR]: '不分區議員選舉',
};

export function ElectionBulletinPage() {
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const { isAuthenticated } = useAuth();

  const { data: elections = [], isLoading } = useQuery({
    queryKey: ['public', 'elections'],
    queryFn: async () => {
      const response = await api.get<Election[]>(API_ENDPOINTS.ELECTIONS.LIST);
      return response.data;
    },
  });

  const bulletins = elections.filter(e => (e.config as any)?.bulletinUrl);

  return (
    <div className={`flex flex-col ${isAuthenticated ? 'h-[calc(100dvh-220px)] md:h-[calc(100dvh-160px)]' : 'h-[100dvh]'} bg-[var(--color-surface)] overflow-hidden animate-fade-in select-none`}>
      
      {/* Fixed Header - Only show if not authenticated */}
      {!isAuthenticated && (
        <header className="fixed top-0 left-0 right-0 bg-[var(--color-surface)]/95 backdrop-blur-xl z-40 border-b border-[var(--color-outline-variant)]/20 px-4 md:px-8 py-3 md:h-20 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-500">
          <div className="flex items-center justify-between w-full md:w-auto">
              <Link to="/auth/login" className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity">
                  <img src="/sa_logo.webp" alt="Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain" />
                  <div className="flex flex-col">
                      <h1 className="text-sm md:text-xl font-bold text-[var(--color-on-surface)] leading-tight tracking-tight">
                          國立彰化師範大學學生會
                      </h1>
                      <span className="text-[9px] md:text-[11px] text-[var(--color-primary)] font-bold tracking-[0.1em] uppercase opacity-90">
                          NCUE Student Association
                      </span>
                  </div>
              </Link>

              <Link to="/auth/login" className="md:hidden">
                  <Button variant="tonal" size="sm" className="rounded-full px-4 font-bold" icon={<ArrowLeft className="w-4 h-4" />}>
                      返回首頁
                  </Button>
              </Link>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-6 w-full md:w-auto">
              <h2 className="hidden lg:block text-lg font-bold text-[var(--color-primary)] tracking-wider whitespace-nowrap">選舉公報</h2>
              
              <Link to="/auth/login" className="hidden md:block">
                  <Button variant="tonal" className="rounded-xl font-bold px-5" icon={<ArrowLeft className="w-4 h-4" />}>
                      返回首頁
                  </Button>
              </Link>
          </div>
        </header>
      )}

      {/* Main Content Area - Adjust padding for responsive header */}
      <main className={`flex-1 overflow-hidden ${!isAuthenticated ? 'pt-[136px] md:pt-20' : ''}`}>
        <div className={`h-full max-w-7xl mx-auto px-4 ${!isAuthenticated ? 'md:px-12' : ''} py-6 md:py-8 flex flex-col md:flex-row gap-8`}>
            
            {/* List Side */}
            <div className={`flex-1 flex flex-col gap-6 ${selectedElection ? 'hidden lg:flex' : 'flex'}`}>
                {isAuthenticated && (
                   <header className="flex flex-col gap-3 mb-2">
                      <div className="flex items-center gap-3">
                          <div className="h-8 w-1.5 bg-[var(--color-primary)] rounded-full" />
                          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-on-surface)] tracking-tight">
                              選舉公報
                          </h2>
                      </div>
                  </header>
                )}
                
                <div className="flex items-center justify-between px-2">
                    <h2 className="type-title-medium font-bold text-[var(--color-primary)] uppercase tracking-widest">
                        正式公報列表 ({bulletins.length})
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {isLoading ? (
                        [1,2,3].map(i => <div key={i} className="h-24 bg-[var(--color-surface-container-low)] rounded-xl animate-pulse" />)
                    ) : bulletins.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                            <FileText className="w-16 h-16 mb-4" />
                            <p className="font-bold">目前尚無已發布的選舉公報</p>
                        </div>
                    ) : (
                        bulletins.map((election) => (
                            <div 
                                key={election.id}
                                onClick={() => setSelectedElection(election)}
                                className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 flex items-center gap-5 group ${
                                    selectedElection?.id === election.id 
                                        ? 'bg-[var(--color-primary-container)] border-[var(--color-primary)] elevation-1' 
                                        : 'bg-[var(--color-surface-container-low)] border-transparent hover:bg-[var(--color-surface-container-high)]'
                                }`}
                            >
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                    selectedElection?.id === election.id 
                                        ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' 
                                        : 'bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] group-hover:scale-105'
                                }`}>
                                    <FileText className="w-7 h-7" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-lg font-bold truncate mb-1 ${
                                        selectedElection?.id === election.id ? 'text-[var(--color-on-primary-container)]' : 'text-[var(--color-on-surface)]'
                                    }`}>
                                        {election.name}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs font-medium opacity-60">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(election.startTime!).toLocaleDateString()}
                                        </span>
                                        <span>•</span>
                                        <span>{ELECTION_TYPE_LABELS[election.type] || election.type}</span>
                                    </div>
                                </div>
                                <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${
                                    selectedElection?.id === election.id ? 'translate-x-1 opacity-100' : 'opacity-20 group-hover:opacity-60'
                                }`} />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Preview Side */}
            <div className={`flex-[1.5] h-full flex flex-col gap-6 ${!selectedElection ? 'hidden lg:flex' : 'flex'}`}>
                {selectedElection ? (
                    <div className="h-full flex flex-col animate-slide-up">
                        <div className="flex items-center justify-between mb-4 lg:mb-6 px-2">
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="text" 
                                    className="lg:hidden p-0 w-10 h-10 min-w-0" 
                                    onClick={() => setSelectedElection(null)}
                                    icon={<ArrowLeft className="w-5 h-5" />}
                                />
                                <h2 className="text-xl font-black text-[var(--color-on-surface)] line-clamp-1">
                                    {selectedElection.name}
                                </h2>
                            </div>
                            <a 
                                href={(selectedElection.config as any).bulletinUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                <Button variant="tonal" size="sm" icon={<ExternalLink className="w-4 h-4" />} className="rounded-xl px-4">
                                    在新分頁開啟
                                </Button>
                            </a>
                        </div>

                        <div className="flex-1 rounded-xl border border-[var(--color-outline-variant)] overflow-hidden bg-black/5 elevation-1">
                            <iframe 
                                src={(selectedElection.config as any).bulletinUrl.replace('/view', '/preview')} 
                                className="w-full h-full border-none"
                                title="Bulletin Preview"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[var(--color-surface-container-low)] rounded-xl border border-dashed border-[var(--color-outline-variant)] opacity-60">
                        <div className="p-8 rounded-full bg-[var(--color-surface-container-high)] mb-6">
                            <Info className="w-16 h-16 text-[var(--color-outline)]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">請選擇選舉名稱</h3>
                        <p className="max-w-xs font-medium">點擊左側列表中的選舉，即可在此即時預覽其正式公報內容。</p>
                    </div>
                )}
            </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
            background: var(--color-outline-variant); 
            border-radius: 10px; 
            opacity: 0.3;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-primary); }
      `}} />
    </div>
  );
}
