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
  ExternalLink,
  Moon,
  Sun
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

// iOS Color Palette
const iOSColors = {
  green: '#34C759',
  red: '#FF3B30',
  blue: '#007AFF',
  orange: '#FF9500',
  purple: '#AF52DE',
  gray: '#8E8E93',
  darkGray: '#1C1C1E',
  lightGray: '#F2F2F7',
};

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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
          const dayChangeStr = stockRow[7] || "0%";
          const dayChange = parseFloat(dayChangeStr.replace(/[%,]/g, '')) || 0;
          const growthStr = stockRow[9] || "0%";
          const growth = parseFloat(growthStr.replace(/[%,]/g, '')) || 0;
          const reason = stockRow[11] || "";

          if (symbol && symbol !== 'Symbol' && symbol !== 'TOTALS') {
            stocks.push({
              symbol,
              buyPrice: avgPrice,
              currentPrice: currentPrice,
              dayChange: dayChange,
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
            dayChange: 0,
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

    // Find top performing stock of the day
    const topDayStock = allStocks.length > 0
      ? allStocks.reduce((prev, curr) => (prev.dayChange > curr.dayChange) ? prev : curr, allStocks[0])
      : null;

    // Find most common tickers across all portfolios
    const tickerCounts = allStocks.reduce((acc, stock) => {
      acc[stock.symbol] = (acc[stock.symbol] || 0) + 1;
      return acc;
    }, {});
    const mostCommonTickers = Object.entries(tickerCounts)
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      topPerformer: data[0],
      bottomPerformer: data[data.length - 1],
      topStock,
      worstStock,
      top10Stocks,
      worst10Stocks,
      topDayStock,
      mostCommonTickers,
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

  const filteredParticipants = useMemo(() => {
    return data.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data, searchTerm]);

  // UI Helper components for the iOS feel
  const StatCard = ({ title, value, subtitle, icon: Icon, isPositive, colorHint, logoUrl }) => (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 shadow-sm border border-gray-100 dark:border-[#2C2C2E] flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
        {Icon && (
          <div className={`p-2 rounded-full ${colorHint === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center gap-3 mb-1">
          {logoUrl && value !== '-' && (
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center overflow-hidden shrink-0">
              <img 
                src={logoUrl} 
                alt="logo"
                className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          <p className="text-[28px] font-bold tracking-tight text-black dark:text-white">{value}</p>
        </div>
        {subtitle && (
          <p className={`text-[15px] font-medium ${isPositive === true ? 'text-[#34C759]' : isPositive === false ? 'text-[#FF3B30]' : 'text-gray-500 dark:text-gray-400'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  const StockListItem = ({ rank, symbol, subtext, value, isPositive, customRight }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#2C2C2E] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-400">
          {rank}
        </div>
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center overflow-hidden">
          <img 
            src={getTickerLogoUrl(symbol)} 
            alt={symbol}
            className="w-full h-full object-contain"
            onError={(e) => { 
              e.target.style.display = 'none'; 
              e.target.parentElement.innerHTML = `<span class="font-bold text-xs text-gray-400">${symbol.slice(0,3)}</span>`;
            }}
          />
        </div>
        <div>
          <p className="font-semibold text-[17px] text-black dark:text-white">{symbol}</p>
          {subtext && <p className="text-[13px] text-gray-500 dark:text-gray-400">{subtext}</p>}
        </div>
      </div>
      {customRight ? customRight : (
        <div className={`px-2.5 py-1 rounded-lg text-[15px] font-semibold ${isPositive ? 'bg-[#34C759] text-white' : 'bg-[#FF3B30] text-white'}`}>
          {isPositive ? '+' : ''}{value}%
        </div>
      )}
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] dark:bg-black">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-800 border-t-[#007AFF] rounded-full animate-spin mx-auto"></div>
        <p className="text-[17px] font-semibold text-gray-500 dark:text-gray-400">Syncing with Google Sheets...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] dark:bg-black p-6">
      <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-[20px] shadow-sm max-w-md w-full text-center">
        <AlertCircle className="w-12 h-12 text-[#FF3B30] mx-auto mb-4" />
        <h2 className="text-[22px] font-bold text-black dark:text-white mb-2">Connection Error</h2>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 mb-6">{error}</p>
        <button onClick={fetchData} className="w-full bg-[#007AFF] hover:bg-blue-600 text-white py-3.5 rounded-[14px] font-semibold text-[17px] transition-colors">
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-black dark:text-white transition-colors duration-200 font-sans flex flex-col">
      {/* iOS Style Large Header */}
      <header className="pt-12 pb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex justify-between items-end sticky top-0 bg-[#F2F2F7]/80 dark:bg-black/80 backdrop-blur-xl z-40 border-b border-gray-200/50 dark:border-gray-800/50">
        <div>
          <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {lastUpdated ? `Updated ${lastUpdated}` : '2026 Edition'}
          </p>
          <h1 className="text-[34px] font-bold tracking-tight text-black dark:text-white leading-none">
            Dashboard
          </h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2C2C2E] flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={fetchData} 
            className="w-10 h-10 rounded-full bg-[#007AFF]/10 dark:bg-[#007AFF]/20 flex items-center justify-center text-[#007AFF] transition-colors"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6 w-full flex-1">
        
        {/* Top Stats Scrollable Row (iOS style horizontal scroll on mobile) */}
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 snap-x hide-scrollbar">
          <div className="min-w-[280px] sm:min-w-0 sm:flex-1 snap-start">
            <StatCard 
              title="Total Portfolio" 
              value={`$${((stats?.totalPortfolioValue || 0) / 1000).toFixed(1)}K`}
              subtitle={(
                <>
                  <span className={`block ${stats?.totalPnL >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {stats?.totalPnL >= 0 ? '+' : '-'}${Math.abs(stats?.totalPnL || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({stats?.totalPnL >= 0 ? '+' : ''}{((stats?.totalPnL || 0) / (data.length * 10000) * 100).toFixed(2)}%)
                  </span>
                  <span className="block text-gray-500 dark:text-gray-400 text-[13px] mt-0.5">
                    {stats?.winnersCount} winners, {stats?.losersCount} losers
                  </span>
                </>
              )}
              icon={DollarSign}
              colorHint="blue"
            />
          </div>
          <div className="min-w-[280px] sm:min-w-0 sm:flex-1 snap-start">
            <StatCard 
              title="Top Performer" 
              value={stats?.topPerformer?.name || '-'}
              subtitle={`+${stats?.topPerformer?.totalReturnPct.toFixed(2)}% return`}
              isPositive={true}
              icon={Trophy}
            />
          </div>
          <div className="min-w-[280px] sm:min-w-0 sm:flex-1 snap-start">
            <StatCard 
              title="Day's Mover" 
              value={stats?.dayMover?.name || '-'}
              subtitle={`${stats?.dayMover?.dayChange >= 0 ? '+' : ''}${stats?.dayMover?.dayChange.toFixed(2)}% today`}
              isPositive={stats?.dayMover?.dayChange >= 0}
              icon={Activity}
            />
          </div>
          <div className="min-w-[280px] sm:min-w-0 sm:flex-1 snap-start">
            <StatCard 
              title="Hot Stock Today" 
              value={stats?.topDayStock?.symbol || '-'}
              subtitle={`${stats?.topDayStock?.dayChange >= 0 ? '+' : ''}${stats?.topDayStock?.dayChange.toFixed(2)}% today`}
              isPositive={stats?.topDayStock?.dayChange >= 0}
              icon={TrendingUp}
              logoUrl={stats?.topDayStock?.symbol ? getTickerLogoUrl(stats.topDayStock.symbol) : null}
            />
          </div>
          <div className="min-w-[280px] sm:min-w-0 sm:flex-1 snap-start">
            <StatCard 
              title="Best Stock Overall" 
              value={stats?.topStock?.symbol || '-'}
              subtitle={`+${stats?.topStock?.return.toFixed(2)}% total gain`}
              isPositive={true}
              icon={Flame}
              logoUrl={stats?.topStock?.symbol ? getTickerLogoUrl(stats.topStock.symbol) : null}
            />
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
          <h2 className="text-[22px] font-bold mb-6">Performance Overview</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#2C2C2E' : '#E5E5EA'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDarkMode ? '#8E8E93' : '#8E8E93', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(v) => `${v}%`} 
                  tick={{ fill: isDarkMode ? '#8E8E93' : '#8E8E93', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: isDarkMode ? '#2C2C2E' : '#F2F2F7' }}
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF', 
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    color: isDarkMode ? '#FFFFFF' : '#000000',
                    fontWeight: 500
                  }}
                  itemStyle={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Return']}
                />
                <Bar dataKey="return" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.return >= 0 ? iOSColors.green : iOSColors.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Three Column Layout for Sub-lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top 10 Stocks */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-bold">Top Picks</h2>
              <Flame className="text-[#34C759]" size={20} />
            </div>
            <div>
              {stats?.top10Stocks?.map((stock, idx) => (
                <StockListItem 
                  key={stock.symbol}
                  rank={idx + 1}
                  symbol={stock.symbol}
                  value={stock.return.toFixed(1)}
                  isPositive={true}
                />
              ))}
            </div>
          </div>

          {/* Worst 10 Stocks */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-bold">Worst Picks</h2>
              <TrendingDown className="text-[#FF3B30]" size={20} />
            </div>
            <div>
              {stats?.worst10Stocks?.map((stock, idx) => (
                <StockListItem 
                  key={stock.symbol}
                  rank={idx + 1}
                  symbol={stock.symbol}
                  value={stock.return.toFixed(1)}
                  isPositive={stock.return >= 0}
                />
              ))}
            </div>
          </div>

          {/* Most Common Tickers */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-bold">Most Common</h2>
              <Users className="text-[#007AFF]" size={20} />
            </div>
            <div>
              {stats?.mostCommonTickers?.map((ticker, idx) => (
                <StockListItem 
                  key={ticker.symbol}
                  rank={idx + 1}
                  symbol={ticker.symbol}
                  customRight={
                    <p className="font-bold text-[#007AFF] text-[15px]">{ticker.count} picks</p>
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard iOS List Style */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[22px] font-bold">Rankings</h2>
          </div>
          {/* Search iOS Style */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search participant" 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-[#2C2C2E] border-none rounded-[10px] text-[17px] text-black dark:text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#007AFF] outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            {filteredParticipants.map((p, idx) => (
              <div 
                key={p.id} 
                onClick={() => setSelectedUser(p)} 
                className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#2C2C2E] last:border-0 cursor-pointer hover:opacity-70 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center text-[15px] font-semibold text-gray-400">
                    {p.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center text-white font-bold text-lg">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[17px] text-black dark:text-white">{p.name}</p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">${p.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2.5 py-1 rounded-lg text-[15px] font-semibold inline-block mb-1 ${p.totalReturnPct >= 0 ? 'bg-[#34C759] text-white' : 'bg-[#FF3B30] text-white'}`}>
                    {p.totalReturnPct >= 0 ? '+' : ''}{p.totalReturnPct.toFixed(2)}%
                  </div>
                  <p className={`text-[12px] font-medium ${p.dayChange >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {p.dayChange >= 0 ? '+' : ''}{p.dayChange.toFixed(2)}% Today
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats Footer Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-4 text-center shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
            <p className="text-gray-500 dark:text-gray-400 text-[13px] font-medium mb-1">Avg. Return</p>
            <p className={`text-xl font-bold ${(stats?.avgReturn || 0) >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
              {(stats?.avgReturn || 0) >= 0 ? '+' : ''}{(stats?.avgReturn || 0).toFixed(2)}%
            </p>
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-4 text-center shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
            <p className="text-gray-500 dark:text-gray-400 text-[13px] font-medium mb-1">Total AUM</p>
            <p className="text-xl font-bold text-black dark:text-white">
              ${((stats?.totalPortfolioValue || 0) / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-4 text-center shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
            <p className="text-gray-500 dark:text-gray-400 text-[13px] font-medium mb-1">Best Stock</p>
            <p className="text-xl font-bold text-[#34C759]">
              {stats?.topStock?.symbol}
            </p>
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-4 text-center shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
            <p className="text-gray-500 dark:text-gray-400 text-[13px] font-medium mb-1">Worst Stock</p>
            <p className="text-xl font-bold text-[#FF3B30]">
              {stats?.worstStock?.symbol}
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 dark:border-gray-800/50 mt-auto pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-400 dark:text-gray-500 text-[13px] font-medium">
            <p>2026 Stock Competition • $10,000 Initial Capital</p>
            <p>Data synced from Google Sheets</p>
          </div>
        </div>
      </footer>

      {/* Detail Modal (iOS Sheet Style) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
          <div 
            className="bg-[#F2F2F7] dark:bg-black w-full sm:max-w-2xl sm:rounded-[32px] rounded-t-[32px] overflow-hidden shadow-2xl h-[85vh] sm:h-auto sm:max-h-[90vh] flex flex-col transform transition-transform"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Handle for Mobile */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden bg-white dark:bg-[#1C1C1E]">
              <div className="w-10 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            {/* Modal Header */}
            <div className="px-6 py-4 bg-white dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-[#2C2C2E] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#007AFF] rounded-full flex items-center justify-center text-xl font-bold text-white">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-[22px] font-bold text-black dark:text-white leading-tight">{selectedUser.name}</h3>
                  <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium">Rank #{selectedUser.rank}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Stats Summary */}
            <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-[#2C2C2E]">
              <div className="bg-white dark:bg-[#1C1C1E] p-4 text-center">
                <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-1">Portfolio Value</p>
                <p className="text-[22px] font-bold text-black dark:text-white">
                  ${selectedUser.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white dark:bg-[#1C1C1E] p-4 text-center">
                <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-1">Total Return</p>
                <p className={`text-[22px] font-bold ${selectedUser.totalReturnPct >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                  {selectedUser.totalReturnPct >= 0 ? '+' : ''}{selectedUser.totalReturnPct.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Holdings List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F2F2F7] dark:bg-black">
              <h4 className="text-[20px] font-bold mb-4 px-2 text-black dark:text-white">Holdings ({selectedUser.stocks.length})</h4>
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] overflow-hidden">
                {selectedUser.stocks.map((s, i) => (
                  <div key={i} className="flex flex-col p-4 border-b border-gray-100 dark:border-[#2C2C2E] last:border-0">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center overflow-hidden">
                          <img 
                            src={getTickerLogoUrl(s.symbol)} 
                            alt={s.symbol}
                            className="w-full h-full object-contain"
                            onError={(e) => { 
                              e.target.style.display = 'none'; 
                              e.target.parentElement.innerHTML = `<span class="font-bold text-xs text-gray-400">${s.symbol.slice(0,4)}</span>`;
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-[17px] text-black dark:text-white">{s.symbol}</p>
                          <p className="text-[13px] text-gray-500 dark:text-gray-400">
                            Avg: ${s.buyPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <div className={`px-2.5 py-1 rounded-lg text-[15px] font-semibold ${s.return >= 0 ? 'bg-[#34C759] text-white' : 'bg-[#FF3B30] text-white'}`}>
                          {s.return >= 0 ? '+' : ''}{s.return.toFixed(2)}%
                        </div>
                        <p className={`text-[12px] font-medium ${s.dayChange >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                          {s.dayChange >= 0 ? '+' : ''}{s.dayChange.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    {s.reason && (
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-[#2C2C2E]">
                        <span className="font-semibold text-black dark:text-white mr-1">Rationale:</span> 
                        {s.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Safe Area Padding for mobile */}
            <div className="pb-8 sm:pb-0 bg-[#F2F2F7] dark:bg-black"></div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;