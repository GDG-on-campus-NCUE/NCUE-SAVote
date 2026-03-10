import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { type Election } from '@savote/shared-types';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { FileText, ExternalLink, Search, Info, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ElectionBulletinPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);

  const { data: elections = [], isLoading } = useQuery({
    queryKey: ['public', 'elections'],
    queryFn: async () => {
      const response = await api.get<Election[]>(API_ENDPOINTS.ELECTIONS.LIST);
      return response.data;
    },
  });

  const filteredElections = elections.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const bulletins = filteredElections.filter(e => (e.config as any)?.bulletinUrl);

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--color-surface)] overflow-hidden animate-fade-in">
      
      {/* Fixed Header */}
      <header className="shrink-0 border-b border-[var(--color-outline-variant)]/20 px-6 py-4 md:px-12 md:py-6 bg-[var(--color-surface)]/80 backdrop-blur-xl z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Link to="/auth/login">
                    <Button variant="tonal" className="rounded-2xl w-10 h-10 p-0" icon={<ArrowLeft className="w-5 h-5" />} />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[var(--color-on-surface)] tracking-tight">選舉公報中心</h1>
                    <p className="text-xs md:text-sm text-[var(--color-on-surface-variant)] font-medium opacity-70">
                        查看國立彰化師範大學學生會各項選舉正式公報
                    </p>
                </div>
            </div>

            {/* Compact Search */}
            <div className="relative group w-full md:w-72">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-[var(--color-outline)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                </div>
                <input 
                    type="text" 
                    placeholder="搜尋選舉案件..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 h-11 bg-[var(--color-surface-container-high)] border border-transparent focus:border-[var(--color-primary)]/30 focus:bg-[var(--color-surface)] rounded-full text-sm text-[var(--color-on-surface)] transition-all outline-none elevation-1"
                />
            </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable on mobile, Grid on desktop */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 md:px-12 py-6 md:py-8 flex flex-col md:flex-row gap-8">
            
            {/* List Side */}
            <div className={`flex-1 flex flex-col gap-6 ${selectedElection ? 'hidden lg:flex' : 'flex'}`}>
                <div className="flex items-center justify-between px-2">
                    <h2 className="type-title-medium font-bold text-[var(--color-primary)] uppercase tracking-widest">
                        正式公報列表 ({bulletins.length})
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {isLoading ? (
                        [1,2,3].map(i => <div key={i} className="h-24 bg-[var(--color-surface-container-low)] rounded-[28px] animate-pulse" />)
                    ) : bulletins.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                            <FileText className="w-16 h-16 mb-4" />
                            <p className="font-bold">目前尚無已發布的公報</p>
                        </div>
                    ) : (
                        bulletins.map((election) => (
                            <div 
                                key={election.id}
                                onClick={() => setSelectedElection(election)}
                                className={`p-6 rounded-[32px] border cursor-pointer transition-all duration-300 flex items-center gap-5 group ${
                                    selectedElection?.id === election.id 
                                        ? 'bg-[var(--color-primary-container)] border-[var(--color-primary)] elevation-1' 
                                        : 'bg-[var(--color-surface-container-low)] border-transparent hover:bg-[var(--color-surface-container-high)]'
                                }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
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
                                        <span>{election.type}</span>
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
                        <div className="flex items-center justify-between mb-4 lg:mb-6">
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
                                <Button variant="filled" size="sm" icon={<ExternalLink className="w-4 h-4" />} className="rounded-xl">
                                    在新分頁開啟
                                </Button>
                            </a>
                        </div>

                        <Card className="flex-1 rounded-[40px] border border-[var(--color-outline-variant)]/30 overflow-hidden bg-black/5 elevation-1">
                            <iframe 
                                src={(selectedElection.config as any).bulletinUrl.replace('/view', '/preview')} 
                                className="w-full h-full border-none"
                                title="Bulletin Preview"
                            />
                        </Card>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[var(--color-surface-container-low)] rounded-[40px] border border-dashed border-[var(--color-outline-variant)] opacity-60">
                        <div className="p-8 rounded-full bg-[var(--color-surface-container-high)] mb-6">
                            <Info className="w-16 h-16 text-[var(--color-outline)]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">請選擇選舉案件</h3>
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
