import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  User, 
  BarChart3, 
  PieChart, 
  LayoutDashboard,
  ArrowUpRight,
  ChevronRight,
  Info,
  Trophy,
  Star,
  Zap,
  RefreshCw,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import Papa from 'papaparse';

// REPLACE THIS WITH YOUR GOOGLE SHEETS CSV URL
// Ensure you published the specific tab "2026 Stock Comp" as CSV
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCi_G5IGBW41JYBzTg_--k4FSaYsC8mpaKm9RsCKf93pXtyT0mxdYUCSDpSllieY0T5bJdfgYr5ekj/pub?gid=1411541951&single=true&output=csv";

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(SHEET_URL);
      if (!response.ok) throw new Error("Could not fetch spreadsheet data.");
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            processCompetitionData(results.data);
            setLastUpdated(new Date().toLocaleTimeString());
          } catch (e) {
            setError("The spreadsheet format is unexpected. Please check the column/row indices.");
            console.error(e);
          }
          setLoading(false);
        },
        error: (err) => {
          setError("Failed to parse CSV format.");
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err.message || "Could not connect to Google Sheets.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Precise Mapping based on your CSV Structure:
   * Row 0: Names (Columns 1-18)
   * Rows 1-10: Stock Symbols
   * Rows 11-20: Beginning Price
   * Rows 21-30: Current Price
   * Rows 41-50: Return % per stock
   * Row 51: Total Portfolio Return %
   * Row 52: Weekly Portfolio Return %
   */
  const processCompetitionData = (rawRows) => {
    if (!rawRows || rawRows.length < 52) {
      throw new Error("CSV doesn't have enough rows (need at least 53 rows for indices).");
    }

    const names = rawRows[0].slice(1, 19); 
    const participants = names.map((name, colIdx) => {
      const actualCol = colIdx + 1;
      const stocks = [];
      
      // Parse 10 individual stocks
      for (let i = 0; i < 10; i++) {
        const symbol = rawRows[i + 1][actualCol];
        const startPrice = parseFloat((rawRows[i + 11][actualCol] || "0").replace(/[$,]/g, ''));
        const currentPrice = parseFloat((rawRows[i + 21][actualCol] || "0").replace(/[$,]/g, ''));
        const retPct = parseFloat((rawRows[i + 41][actualCol] || "0").replace(/[%,]/g, ''));

        if (symbol && symbol !== 'TBD') {
          stocks.push({
            symbol,
            buyPrice: startPrice,
            currentPrice: currentPrice,
            return: retPct
          });
        }
      }

      // Parse Portfolio Aggregates
      const totalReturnPct = parseFloat((rawRows[51][actualCol] || "0").replace(/[%,]/g, ''));
      const weeklyReturnPct = parseFloat((rawRows[52][actualCol] || "0").replace(/[%,]/g, ''));

      return {
        id: name.toLowerCase().replace(/\s/g, '-'),
        name: name || `Player ${colIdx + 1}`,
        totalReturnPct,
        weeklyReturn: weeklyReturnPct,
        stocks,
        totalPnL: (totalReturnPct / 100) * 10000 // Assumes $10k initial
      };
    });

    // Sort by performance and assign ranks
    const sorted = participants
      .filter(p => p.name.trim() !== "")
      .sort((a, b) => b.totalReturnPct - a.totalReturnPct)
      .map((p, i) => ({ ...p, rank: i + 1 }));

    setData(sorted);
  };

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    
    // Top Stock
    const allStocks = data.flatMap(p => p.stocks);
    const topStock = allStocks.length > 0 
      ? allStocks.reduce((prev, curr) => (prev.return > curr.return) ? prev : curr, allStocks[0])
      : null;

    // Weekly Winner
    const weeklyWinner = [...data].sort((a, b) => b.weeklyReturn - a.weeklyReturn)[0];

    return {
      topPerformer: data[0],
      topStock,
      weeklyWinner,
      avgReturn: data.reduce((sum, p) => sum + p.totalReturnPct, 0) / data.length
    };
  }, [data]);

  const filteredParticipants = useMemo(() => {
    return data.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data, searchTerm]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <RefreshCw className="w-16 h-16 text-blue-600 animate-spin opacity-20" />
          <TrendingUp className="absolute inset-0 w-8 h-8 m-auto text-blue-600" />
        </div>
        <p className="text-slate-500 font-bold tracking-tight animate-pulse">SYNCING LIVE DATA...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-rose-200 dark:border-rose-900/30 max-w-md w-full shadow-xl text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Connection Error</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{error}</p>
        <button onClick={fetchData} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
          <RefreshCw size={18} /> Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFF] dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/10">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/30">
              <TrendingUp className="text-white" size={24} />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase">Comp<span className="text-blue-600">2026</span></span>
          </div>
          
          <div className="hidden md:flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('leaderboard')} 
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Leaderboard
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Analytics
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:block text-right mr-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Sync</p>
              <p className="text-xs font-bold font-mono">{lastUpdated}</p>
            </div>
            <button onClick={fetchData} className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 transition-all shadow-sm active:scale-95">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Highlight Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Weekly Winner Card */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <Zap size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-md w-fit px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/20 flex items-center gap-2">
                <Zap size={12} fill="currentColor" /> Weekly MVP
              </div>
              <h3 className="text-4xl font-black mb-1 leading-none tracking-tight">{stats?.weeklyWinner?.name}</h3>
              <p className="text-orange-100 font-bold text-lg flex items-center gap-1">
                <ArrowUpRight size={20} strokeWidth={3} /> {stats?.weeklyWinner?.weeklyReturn.toFixed(2)}% <span className="text-sm font-medium opacity-70">this week</span>
              </p>
            </div>
          </div>

          {/* Top Stock Card */}
          <div className="bg-slate-900 dark:bg-blue-950 p-8 rounded-[2.5rem] border border-slate-800 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Star size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <div className="bg-blue-500/20 w-fit px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 text-blue-400 border border-blue-500/20 flex items-center gap-2">
                <Star size={12} fill="currentColor" /> Star Performer
              </div>
              <h3 className="text-4xl font-black mb-1 leading-none tracking-tight">{stats?.topStock?.symbol}</h3>
              <p className="text-blue-300 font-bold text-lg flex items-center gap-1">
                <TrendingUp size={20} strokeWidth={3} /> {stats?.topStock?.return.toFixed(2)}% <span className="text-sm font-medium opacity-70">All-Time</span>
              </p>
            </div>
          </div>

          {/* Leader Card */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:-translate-y-2 transition-transform duration-700">
              <Trophy size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <div className="bg-slate-100 dark:bg-slate-800 w-fit px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Trophy size={12} fill="currentColor" /> Current Rank #1
              </div>
              <h3 className="text-4xl font-black mb-1 leading-none tracking-tight">{stats?.topPerformer?.name}</h3>
              <p className="text-emerald-500 font-bold text-lg flex items-center gap-1">
                Total: {stats?.topPerformer?.totalReturnPct.toFixed(2)}% <span className="text-sm font-medium opacity-70">Return</span>
              </p>
            </div>
          </div>
        </div>

        {activeTab === 'leaderboard' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <LayoutDashboard className="text-blue-600" />
                Live Standings
              </h2>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Find participant..." 
                  className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                      <th className="px-8 py-6">Rank</th>
                      <th className="px-8 py-6">Participant</th>
                      <th className="px-8 py-6">Total ROI</th>
                      <th className="px-8 py-6">Weekly Move</th>
                      <th className="px-8 py-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredParticipants.map((p) => (
                      <tr 
                        key={p.id} 
                        onClick={() => setSelectedUser(p)} 
                        className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-all group relative active:scale-[0.99]"
                      >
                        <td className="px-8 py-6">
                          <span className={`text-2xl font-black italic ${p.rank === 1 ? 'text-amber-500' : p.rank === 2 ? 'text-slate-400' : p.rank === 3 ? 'text-amber-700' : 'text-slate-200 dark:text-slate-800'}`}>
                            {p.rank < 10 ? `0${p.rank}` : p.rank}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-blue-600 text-xs shadow-inner">
                              {p.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-lg tracking-tight group-hover:text-blue-600 transition-colors">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`text-xl font-black font-mono ${p.totalReturnPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {p.totalReturnPct >= 0 ? '+' : ''}{p.totalReturnPct.toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${p.weeklyReturn >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                            {p.weeklyReturn >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(p.weeklyReturn).toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all">
                            <ChevronRight size={20} strokeWidth={3} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3"><BarChart3 size={24} className="text-blue-600" /> Return Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis dataKey="name" hide />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: '#0f172a', color: '#fff'}} />
                    <Bar dataKey="totalReturnPct" radius={[10, 10, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell key={index} fill={entry.totalReturnPct > 0 ? '#10b981' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-center">
              <div className="space-y-10">
                <div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2"><PieChart size={14} /> Group Pulse</p>
                  <p className="text-sm text-slate-500 mb-2 font-medium">Average Portfolio Return</p>
                  <p className="text-7xl font-black text-blue-600 tracking-tighter">{stats?.avgReturn.toFixed(2)}<span className="text-3xl">%</span></p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-2">In the Green</p>
                    <p className="text-4xl font-black text-emerald-700 dark:text-emerald-300">{data.filter(p=>p.totalReturnPct > 0).length}</p>
                  </div>
                  <div className="p-8 bg-rose-50 dark:bg-rose-950/20 rounded-[2rem] border border-rose-100 dark:border-rose-900/30">
                    <p className="text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-widest mb-2">In the Red</p>
                    <p className="text-4xl font-black text-rose-700 dark:text-rose-300">{data.filter(p=>p.totalReturnPct <= 0).length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-blue-500/40">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tight">{selectedUser.name}'s Portfolio</h3>
                  <div className="flex items-center gap-3 mt-1 text-slate-500 font-bold">
                    <span className="flex items-center gap-1"><Trophy size={14} className="text-amber-500" /> Rank #{selectedUser.rank}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>{selectedUser.stocks.length} Stocks Picked</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-4 hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all border border-transparent hover:border-slate-200">
                <Info size={28} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-10 overflow-y-auto bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedUser.stocks.map((s, i) => (
                  <div key={i} className="group p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-xs text-slate-400 border border-slate-100 dark:border-slate-800">
                        {s.symbol}
                      </div>
                      <div>
                        <p className="font-black text-lg tracking-tight group-hover:text-blue-600 transition-colors">{s.symbol}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry: ${s.buyPrice.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-black font-mono ${s.return >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {s.return >= 0 ? '+' : ''}{s.return.toFixed(2)}%
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current: ${s.currentPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-10 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio PnL</p>
                  <p className={`text-2xl font-black ${selectedUser.totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ${Math.abs(selectedUser.totalPnL).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    <span className="text-xs ml-1 opacity-60">{selectedUser.totalPnL >= 0 ? 'Gain' : 'Loss'}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-2xl font-black shadow-xl shadow-slate-900/20 dark:shadow-none hover:scale-105 active:scale-95 transition-all"
              >
                CLOSE VIEW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-100 dark:border-slate-800/50 mt-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <Calendar size={14} /> 2026 Calendar Year
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <Info size={14} /> $10k Initial Capital
          </div>
        </div>
        <p className="text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase">Built for 2026 Stock Comp</p>
      </footer>
    </div>
  );
};

export default App;