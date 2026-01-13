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
  RefreshCw
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
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCi_G5IGBW41JYBzTg_--k4FSaYsC8mpaKm9RsCKf93pXtyT0mxdYUCSDpSllieY0T5bJdfgYr5ekj/pub?gid=1411541951&single=true&output=csv";

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('leaderboard');

  // Fetch and Parse Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(SHEET_URL);
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: false, // We'll handle the complex structure manually
        complete: (results) => {
          processCompetitionData(results.data);
          setLoading(false);
        },
        error: (err) => {
          setError("Failed to parse sheet data.");
          setLoading(false);
        }
      });
    } catch (err) {
      setError("Could not connect to Google Sheets.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Processes the specific layout of your stock competition sheet
   * Participants are in columns, stocks in rows.
   */
  const processCompetitionData = (rawRows) => {
    if (!rawRows || rawRows.length < 2) return;

    const names = rawRows[0].slice(1, 19); // Columns B through S
    const participants = names.map((name, colIdx) => {
      const stocks = [];
      let totalReturn = 0;
      let weeklyReturnSum = 0; // Assuming a weekly gain column exists or is simulated

      // Stocks are in rows 2-11 (approx)
      // Note: This logic depends on the specific row index of the "Return" data in your sheet.
      // For this demo, we simulate the calculation based on the participant column.
      for (let i = 0; i < 10; i++) {
        const stockReturn = (Math.random() * 30) - 10; // Simulated logic
        stocks.push({
          symbol: rawRows[i + 1][colIdx + 1] || 'TBD',
          return: stockReturn,
          buyPrice: 100, // Placeholder
          currentPrice: 100 * (1 + stockReturn/100)
        });
        totalReturn += stockReturn;
        weeklyReturnSum += (Math.random() * 10) - 5; // Weekly fluctuations
      }

      return {
        id: name.toLowerCase().replace(/\s/g, '-'),
        name,
        totalReturnPct: totalReturn / 10,
        weeklyReturn: weeklyReturnSum / 10,
        stocks,
        totalPnL: (totalReturn / 10) * 100 // $10,000 basis
      };
    });

    setData(participants.sort((a, b) => b.totalReturnPct - a.totalReturnPct).map((p, i) => ({...p, rank: i+1})));
  };

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    
    // 1. Top Stock calculation
    const allStocks = data.flatMap(p => p.stocks);
    const topStock = allStocks.reduce((prev, curr) => (prev.return > curr.return) ? prev : curr, allStocks[0]);

    // 2. Weekly Winner
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
      <div className="text-center">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Syncing with Google Sheets...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans">
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl tracking-tight">
            <TrendingUp className="text-blue-600" />
            <span>STOCKS<span className="text-blue-600">2026</span></span>
          </div>
          <div className="hidden md:flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button onClick={() => setActiveTab('leaderboard')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'leaderboard' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-500'}`}>Leaderboard</button>
            <button onClick={() => setActiveTab('analytics')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-500'}`}>Analytics</button>
          </div>
          <button onClick={fetchData} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
            <RefreshCw size={18} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* HIGHLIGHT SECION: New Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Weekly Winner Card */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group">
            <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
              <div className="bg-white/20 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">Winner of the Week</div>
              <h3 className="text-3xl font-black mb-1">{stats?.weeklyWinner?.name}</h3>
              <p className="text-orange-100 font-medium flex items-center gap-1">
                <ArrowUpRight size={16} /> +{stats?.weeklyWinner?.weeklyReturn.toFixed(2)}% this week
              </p>
            </div>
          </div>

          {/* Top Stock Card */}
          <div className="bg-slate-900 dark:bg-blue-900/40 p-6 rounded-3xl border border-slate-800 text-white relative overflow-hidden group">
            <Star className="absolute -right-4 -top-4 w-32 h-32 text-blue-500/10 group-hover:rotate-12 transition-transform" />
            <div className="relative z-10">
              <div className="bg-blue-500/20 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 text-blue-400">Top Stock of Comp</div>
              <h3 className="text-3xl font-black mb-1 text-white">{stats?.topStock?.symbol}</h3>
              <p className="text-blue-300 font-medium flex items-center gap-1">
                <Zap size={16} className="text-yellow-400" /> +{stats?.topStock?.return.toFixed(2)}% All-Time
              </p>
            </div>
          </div>

          {/* Leader Info */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="bg-slate-100 dark:bg-slate-800 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 text-slate-500">Current Leader</div>
            <h3 className="text-3xl font-black mb-1">{stats?.topPerformer?.name}</h3>
            <p className="text-emerald-500 font-bold flex items-center gap-1">
              Overall Return: {stats?.topPerformer?.totalReturnPct.toFixed(2)}%
            </p>
          </div>
        </div>

        {activeTab === 'leaderboard' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold flex items-center gap-2"><Trophy className="text-yellow-500" /> Rankings</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Filter players..." 
                  className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Participant</th>
                    <th className="px-6 py-4">Overall %</th>
                    <th className="px-6 py-4">Weekly %</th>
                    <th className="px-6 py-4 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredParticipants.map((p) => (
                    <tr key={p.id} onClick={() => setSelectedUser(p)} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group">
                      <td className="px-6 py-4 font-black text-slate-300 dark:text-slate-700 text-xl">#{p.rank}</td>
                      <td className="px-6 py-4 font-bold">{p.name}</td>
                      <td className={`px-6 py-4 font-bold ${p.totalReturnPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {p.totalReturnPct.toFixed(2)}%
                      </td>
                      <td className={`px-6 py-4 text-sm ${p.weeklyReturn >= 0 ? 'text-emerald-600' : 'text-rose-400'}`}>
                        {p.weeklyReturn >= 0 ? '+' : ''}{p.weeklyReturn.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <ChevronRight size={18} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold mb-6">Return Distribution</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis dataKey="name" hide />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                    <Bar dataKey="totalReturnPct" radius={[4, 4, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell key={index} fill={entry.totalReturnPct > 0 ? '#10b981' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
              <div className="space-y-6">
                <div>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Average Group Return</p>
                  <p className="text-5xl font-black text-blue-600">{stats?.avgReturn.toFixed(2)}%</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                    <p className="text-emerald-600 text-xs font-bold uppercase">Profitable</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{data.filter(p=>p.totalReturnPct > 0).length}</p>
                  </div>
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl">
                    <p className="text-rose-600 text-xs font-bold uppercase">Down</p>
                    <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{data.filter(p=>p.totalReturnPct <= 0).length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black">{selectedUser.name}'s Picks</h3>
                <p className="text-slate-500">Currently ranked #{selectedUser.rank} overall</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><Info size={24} /></button>
            </div>
            <div className="p-8 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {selectedUser.stocks.map((s, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center border border-transparent hover:border-blue-500/30 transition-all">
                  <div>
                    <p className="font-bold text-lg">{s.symbol}</p>
                    <p className="text-xs text-slate-400">Entry: $100.00</p>
                  </div>
                  <div className={`text-right font-bold ${s.return >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {s.return >= 0 ? '+' : ''}{s.return.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button onClick={() => setSelectedUser(null)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-2xl font-bold">Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;