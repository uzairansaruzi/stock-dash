import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  BarChart3, 
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Trophy,
  Flame,
  RefreshCw,
  AlertCircle,
  Users,
  DollarSign,
  Activity,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import Papa from 'papaparse';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCi_G5IGBW41JYBzTg_--k4FSaYsC8mpaKm9RsCKf93pXtyT0mxdYUCSDpSllieY0T5bJdfgYr5ekj/pub?gid=1411541951&single=true&output=csv";

// Logo.dev API for stock ticker logos
const LOGO_API_KEY = "pk_cFuOaPlaTcW8wzBuF-zbsQ";
const getTickerLogoUrl = (symbol) => `https://img.logo.dev/ticker/${symbol}?token=${LOGO_API_KEY}`;

// Color palette
const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  orange: '#f97316',
};

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
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

  const processCompetitionData = (rawRows) => {
    if (!rawRows || rawRows.length < 14) {
      throw new Error("CSV doesn't have enough rows.");
    }

    const names = rawRows[0].slice(1, 19).filter(n => n && n.trim() !== "");
    
    const participantDetailStartRows = {};
    rawRows.forEach((row, idx) => {
      const firstCell = (row[0] || "").trim();
      if (names.some(n => firstCell === n || (firstCell === "Lisa Sweeter Hanson" && n === "Lisa"))) {
        const matchedName = firstCell === "Lisa Sweeter Hanson" ? "Lisa" : firstCell;
        participantDetailStartRows[matchedName] = idx;
      }
    });

    const participants = names.map((name, colIdx) => {
      const actualCol = colIdx + 1;
      const stocks = [];
      
      const stockSymbols = [];
      for (let i = 0; i < 10; i++) {
        const symbol = rawRows[i + 1]?.[actualCol];
        if (symbol && symbol !== 'TBD' && symbol.trim() !== "") {
          stockSymbols.push(symbol.trim());
        }
      }

      const valueStr = rawRows[11]?.[actualCol] || "$10,000";
      const portfolioValue = parseFloat(valueStr.replace(/[$,]/g, '')) || 10000;
      
      const dayChangeStr = rawRows[12]?.[actualCol] || "0%";
      const dayChange = parseFloat(dayChangeStr.replace(/[%,]/g, '')) || 0;
      
      const totalChangeStr = rawRows[13]?.[actualCol] || "0%";
      const totalReturnPct = parseFloat(totalChangeStr.replace(/[%,]/g, '')) || 0;

      const detailName = name === "Lisa" ? "Lisa Sweeter Hanson" : name;
      const detailStartRow = participantDetailStartRows[name] || participantDetailStartRows[detailName];
      
      if (detailStartRow) {
        for (let i = 2; i <= 11; i++) {
          const stockRow = rawRows[detailStartRow + i];
          if (!stockRow || !stockRow[0] || stockRow[0].trim() === "" || stockRow[0].toUpperCase() === "TOTALS") break;
          
          const symbol = stockRow[0]?.trim();
          const avgPrice = parseFloat((stockRow[2] || "0").replace(/[$,]/g, '')) || 0;
          const currentPrice = parseFloat((stockRow[3] || "0").replace(/[$,]/g, '')) || 0;
          const growthStr = stockRow[9] || "0%";
          const growth = parseFloat(growthStr.replace(/[%,]/g, '')) || 0;
          const reason = stockRow[11] || "";

          if (symbol && symbol !== 'Symbol' && symbol !== 'TOTALS') {
            stocks.push({
              symbol,
              buyPrice: avgPrice,
              currentPrice: currentPrice,
              return: growth,
              reason
            });
          }
        }
      } else {
        stockSymbols.forEach(symbol => {
          stocks.push({
            symbol,
            buyPrice: 0,
            currentPrice: 0,
            return: totalReturnPct / stockSymbols.length
          });
        });
      }

      return {
        id: name.toLowerCase().replace(/\s/g, '-'),
        name: name || `Player ${colIdx + 1}`,
        totalReturnPct,
        dayChange,
        portfolioValue,
        stocks,
        totalPnL: portfolioValue - 10000
      };
    });

    const sorted = participants
      .filter(p => p.name.trim() !== "")
      .sort((a, b) => b.totalReturnPct - a.totalReturnPct)
      .map((p, i) => ({ ...p, rank: i + 1 }));

    setData(sorted);
  };

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    
    const allStocks = data.flatMap(p => p.stocks);
    const topStock = allStocks.length > 0 
      ? allStocks.reduce((prev, curr) => (prev.return > curr.return) ? prev : curr, allStocks[0])
      : null;

    const worstStock = allStocks.length > 0
      ? allStocks.reduce((prev, curr) => (prev.return < curr.return) ? prev : curr, allStocks[0])
      : null;

    // Get top 5 unique stocks by return
    const uniqueStocks = allStocks.reduce((acc, stock) => {
      const existing = acc.find(s => s.symbol === stock.symbol);
      if (!existing || stock.return > existing.return) {
        return [...acc.filter(s => s.symbol !== stock.symbol), stock];
      }
      return acc;
    }, []);
    const sortedStocks = [...uniqueStocks].sort((a, b) => b.return - a.return);
    const top10Stocks = sortedStocks.slice(0, 10);
    const worst10Stocks = [...sortedStocks].reverse().slice(0, 10);

    const dayMover = [...data].sort((a, b) => b.dayChange - a.dayChange)[0];
    const totalPortfolioValue = data.reduce((sum, p) => sum + p.portfolioValue, 0);
    const totalPnL = data.reduce((sum, p) => sum + p.totalPnL, 0);

    return {
      topPerformer: data[0],
      bottomPerformer: data[data.length - 1],
      topStock,
      worstStock,
      top10Stocks,
      worst10Stocks,
      dayMover,
      avgReturn: data.reduce((sum, p) => sum + p.totalReturnPct, 0) / data.length,
      totalPortfolioValue,
      totalPnL,
      winnersCount: data.filter(p => p.totalReturnPct > 0).length,
      losersCount: data.filter(p => p.totalReturnPct <= 0).length
    };
  }, [data]);

  const chartData = useMemo(() => {
    return data.map(p => ({
      name: p.name,
      return: p.totalReturnPct,
      value: p.portfolioValue,
      pnl: p.totalPnL
    }));
  }, [data]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Profitable', value: stats.winnersCount, color: COLORS.success },
      { name: 'In Loss', value: stats.losersCount, color: COLORS.danger }
    ];
  }, [stats]);

  const filteredParticipants = useMemo(() => {
    return data.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data, searchTerm]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-500/30 rounded-full animate-spin border-t-indigo-500 mx-auto"></div>
          <TrendingUp className="absolute inset-0 w-8 h-8 m-auto text-indigo-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Loading Portfolio Data</p>
          <p className="text-slate-400 text-sm mt-1">Syncing with Google Sheets...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="bg-slate-800/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
        <p className="text-slate-400 mb-6 text-sm">{error}</p>
        <button onClick={fetchData} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
          <RefreshCw size={18} /> Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Stock Competition</h1>
                <p className="text-xs text-slate-400">2026 Edition</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-xs text-slate-400">Last Updated</p>
                <p className="text-sm font-medium">{lastUpdated}</p>
              </div>
              <button 
                onClick={fetchData} 
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center gap-2 text-indigo-200 text-sm mb-1">
                <Trophy size={16} />
                <span>Leader</span>
              </div>
              <p className="text-2xl font-bold">{stats?.topPerformer?.name}</p>
              <p className="text-indigo-200 text-sm mt-1">+{stats?.topPerformer?.totalReturnPct.toFixed(2)}% return</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center gap-2 text-emerald-200 text-sm mb-1">
                <Flame size={16} />
                <span>Top Stock</span>
              </div>
              <div className="flex items-center gap-3">
                {stats?.topStock?.symbol && (
                  <img 
                    src={getTickerLogoUrl(stats.topStock.symbol)} 
                    alt={stats.topStock.symbol}
                    className="w-10 h-10 rounded-lg bg-white/20 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <p className="text-2xl font-bold">{stats?.topStock?.symbol}</p>
              </div>
              <p className="text-emerald-200 text-sm mt-1">+{stats?.topStock?.return.toFixed(2)}% gain</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center gap-2 text-orange-200 text-sm mb-1">
                <Activity size={16} />
                <span>Day's Mover</span>
              </div>
              <p className="text-2xl font-bold">{stats?.dayMover?.name}</p>
              <p className="text-orange-200 text-sm mt-1">{stats?.dayMover?.dayChange >= 0 ? '+' : ''}{stats?.dayMover?.dayChange.toFixed(2)}% today</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center gap-2 text-purple-200 text-sm mb-1">
                <DollarSign size={16} />
                <span>Total P&L</span>
              </div>
              <p className="text-2xl font-bold">${(stats?.totalPnL / 1000).toFixed(1)}K</p>
              <p className="text-purple-200 text-sm mt-1">{stats?.winnersCount} winners, {stats?.losersCount} losers</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Performance Bar Chart */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg">Performance Overview</h3>
                <p className="text-sm text-slate-400">Total return by participant</p>
              </div>
              <BarChart3 className="text-slate-400" size={20} />
            </div>
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(v) => `${v}%`} stroke="#64748b" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={75} interval={0} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                    }}
                    formatter={(value) => [`${value.toFixed(2)}%`, 'Return']}
                  />
                  <Bar dataKey="return" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.return >= 0 ? COLORS.success : COLORS.danger} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 10 Stocks */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-800/90 backdrop-blur-sm -mx-6 px-6 py-2 -mt-2">
              <div>
                <h3 className="font-semibold text-lg">Top 10 Stocks</h3>
                <p className="text-sm text-slate-400">Best performing picks</p>
              </div>
              <Flame className="text-emerald-400" size={20} />
            </div>
            <div className="space-y-2">
              {stats?.top10Stocks?.map((stock, idx) => (
                <div key={stock.symbol} className="flex items-center justify-between p-2.5 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                      {idx + 1}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center overflow-hidden">
                      <img 
                        src={getTickerLogoUrl(stock.symbol)} 
                        alt={stock.symbol}
                        className="w-full h-full object-contain p-0.5"
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                          e.target.parentElement.innerHTML = `<span class="font-bold text-xs text-slate-300">${stock.symbol.slice(0,3)}</span>`;
                        }}
                      />
                    </div>
                    <p className="font-semibold text-sm">{stock.symbol}</p>
                  </div>
                  <p className="font-bold text-emerald-400 text-sm">+{stock.return.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Worst 10 Stocks */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-800/90 backdrop-blur-sm -mx-6 px-6 py-2 -mt-2">
              <div>
                <h3 className="font-semibold text-lg">Worst 10 Stocks</h3>
                <p className="text-sm text-slate-400">Lowest performing picks</p>
              </div>
              <TrendingDown className="text-red-400" size={20} />
            </div>
            <div className="space-y-2">
              {stats?.worst10Stocks?.map((stock, idx) => (
                <div key={stock.symbol} className="flex items-center justify-between p-2.5 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center text-xs font-bold text-red-400">
                      {idx + 1}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center overflow-hidden">
                      <img 
                        src={getTickerLogoUrl(stock.symbol)} 
                        alt={stock.symbol}
                        className="w-full h-full object-contain p-0.5"
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                          e.target.parentElement.innerHTML = `<span class="font-bold text-xs text-slate-300">${stock.symbol.slice(0,3)}</span>`;
                        }}
                      />
                    </div>
                    <p className="font-semibold text-sm">{stock.symbol}</p>
                  </div>
                  <p className={`font-bold text-sm ${stock.return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stock.return >= 0 ? '+' : ''}{stock.return.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users className="text-indigo-400" size={24} />
                <div>
                  <h3 className="font-semibold text-lg">Leaderboard</h3>
                  <p className="text-sm text-slate-400">{data.length} participants competing</p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search participant..." 
                  className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rank</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Participant</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Portfolio Value</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Return</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Day Change</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">P&L</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredParticipants.map((p, idx) => (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedUser(p)} 
                    className="hover:bg-slate-700/20 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        p.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        p.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                        p.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {p.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium group-hover:text-indigo-400 transition-colors">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.stocks.length} stocks</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">${p.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold ${
                        p.totalReturnPct >= 0 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {p.totalReturnPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {p.totalReturnPct >= 0 ? '+' : ''}{p.totalReturnPct.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1 text-sm ${
                        p.dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {p.dayChange >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {Math.abs(p.dayChange).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${p.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.totalPnL >= 0 ? '+' : '-'}${Math.abs(p.totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg bg-slate-700/50 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-indigo-600 hover:text-white transition-all">
                        <ExternalLink size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <div className="bg-slate-800/30 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Avg. Return</p>
            <p className={`text-xl font-bold ${(stats?.avgReturn || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {(stats?.avgReturn || 0) >= 0 ? '+' : ''}{(stats?.avgReturn || 0).toFixed(2)}%
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Total AUM</p>
            <p className="text-xl font-bold text-white">
              ${((stats?.totalPortfolioValue || 0) / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Best Stock</p>
            <p className="text-xl font-bold text-emerald-400">
              {stats?.topStock?.symbol}
            </p>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-1">Worst Stock</p>
            <p className="text-xl font-bold text-red-400">
              {stats?.worstStock?.symbol}
            </p>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div 
            className="bg-slate-800 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-slate-700 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
              <button 
                onClick={() => setSelectedUser(null)} 
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedUser.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-indigo-200">
                    <span className="flex items-center gap-1">
                      <Trophy size={14} /> Rank #{selectedUser.rank}
                    </span>
                    <span>{selectedUser.stocks.length} Holdings</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Summary */}
            <div className="grid grid-cols-3 gap-px bg-slate-700">
              <div className="bg-slate-800 p-4 text-center">
                <p className="text-slate-400 text-xs mb-1">Portfolio Value</p>
                <p className="text-lg font-bold">${selectedUser.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-slate-800 p-4 text-center">
                <p className="text-slate-400 text-xs mb-1">Total Return</p>
                <p className={`text-lg font-bold ${selectedUser.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedUser.totalReturnPct >= 0 ? '+' : ''}{selectedUser.totalReturnPct.toFixed(2)}%
                </p>
              </div>
              <div className="bg-slate-800 p-4 text-center">
                <p className="text-slate-400 text-xs mb-1">P&L</p>
                <p className={`text-lg font-bold ${selectedUser.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedUser.totalPnL >= 0 ? '+' : '-'}${Math.abs(selectedUser.totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Holdings */}
            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="font-semibold mb-4 text-slate-300">Holdings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedUser.stocks.map((s, i) => (
                  <div 
                    key={i} 
                    className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/30 hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-600/50 flex items-center justify-center overflow-hidden">
                          <img 
                            src={getTickerLogoUrl(s.symbol)} 
                            alt={s.symbol}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => { 
                              e.target.style.display = 'none'; 
                              e.target.parentElement.innerHTML = `<span class="font-bold text-xs text-slate-300">${s.symbol.slice(0,4)}</span>`;
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold">{s.symbol}</p>
                          <p className="text-xs text-slate-400">
                            ${s.buyPrice.toFixed(2)} → ${s.currentPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className={`text-right`}>
                        <p className={`font-bold ${s.return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {s.return >= 0 ? '+' : ''}{s.return.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    {s.reason && (
                      <p className="text-xs text-slate-400 mt-2">{s.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex justify-end">
              <button 
                onClick={() => setSelectedUser(null)} 
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
            <p>2026 Stock Competition • $10,000 Initial Capital</p>
            <p>Data synced from Google Sheets</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
