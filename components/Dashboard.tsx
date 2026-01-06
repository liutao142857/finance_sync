
import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, RefreshCw, BarChart3, ChevronLeft, ChevronRight, 
  ArrowUpRight, ArrowDownLeft, Wallet, Trash2, Edit2, MoreHorizontal,
  ChevronDown, Cloud, CloudUpload, CloudDownload, FileJson, Info, Link, AlertCircle,
  Zap, Power, Monitor
} from 'lucide-react';
import { format, endOfMonth, eachDayOfInterval, isSameDay, addMonths } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { Transaction, TransactionType } from '../types';
import { CATEGORIES, ICON_MAP, LEDGERS } from '../constants';

interface DashboardProps {
  transactions: Transaction[];
  currentLedger: string;
  onSetLedger: (ledger: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: () => void;
  onLinkSync: () => void;
  onRestoreSync: () => void;
  isAutoSyncActive: boolean;
  hasPersistentHandle: boolean;
}

const COLORS = [
  '#FF7043', '#FFB74D', '#4DB6AC', '#81C784', '#64B5F6', '#9575CD', '#F06292', '#A1887F', '#E0E0E0'
];

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, currentLedger, onSetLedger, onAdd, onEdit, onDelete,
  onExport, onImport, onLinkSync, onRestoreSync, isAutoSyncActive, hasPersistentHandle
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [chartType, setChartType] = useState<TransactionType>('expense');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSyncMenu, setShowSyncMenu] = useState(false);

  const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const monthEnd = endOfMonth(selectedMonth);

  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d >= monthStart && d <= monthEnd;
    });
  }, [transactions, selectedMonth, monthStart, monthEnd]);

  const stats = useMemo(() => {
    return monthTransactions.reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else if (t.type === 'expense') acc.expense += t.amount;
      acc.balance = acc.income - acc.expense;
      return acc;
    }, { income: 0, expense: 0, balance: 0 });
  }, [monthTransactions]);

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return days.map(day => {
      const dayTransactions = monthTransactions.filter(t => isSameDay(new Date(t.date), day) && t.type === chartType);
      const amount = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        date: format(day, 'd'),
        fullDate: day,
        amount
      };
    });
  }, [monthTransactions, chartType, monthStart, monthEnd]);

  const categoryStats = useMemo(() => {
    const filtered = monthTransactions.filter(t => t.type === chartType);
    const totals: Record<string, number> = {};
    filtered.forEach(t => {
      totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amount;
    });
    const totalAmount = Object.values(totals).reduce((sum, val) => sum + val, 0);
    return Object.entries(totals)
      .map(([id, amount], index) => {
        const cat = CATEGORIES.find(c => c.id === id);
        return {
          id,
          name: cat?.name || '未知',
          icon: cat?.icon || 'MoreHorizontal',
          amount,
          percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
          color: COLORS[index % COLORS.length]
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthTransactions, chartType]);

  const dailyTransactions = useMemo(() => {
    return transactions.filter(t => isSameDay(new Date(t.date), selectedDate))
      .filter(t => {
        if (!searchQuery) return true;
        const catName = CATEGORIES.find(c => c.id === t.categoryId)?.name || '';
        return catName.includes(searchQuery) || t.note.includes(searchQuery) || t.amount.toString().includes(searchQuery);
      });
  }, [transactions, selectedDate, searchQuery]);

  const dailySummary = useMemo(() => {
    const map: Record<string, { expense: number; income: number }> = {};
    monthTransactions.forEach(t => {
      const dayKey = format(new Date(t.date), 'yyyy-MM-dd');
      if (!map[dayKey]) map[dayKey] = { expense: 0, income: 0 };
      if (t.type === 'expense') map[dayKey].expense += t.amount;
      else if (t.type === 'income') map[dayKey].income += t.amount;
    });
    return map;
  }, [monthTransactions]);

  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = monthStart.getDay();
    const padding = startDay === 0 ? 6 : startDay - 1;
    return [...Array(padding).fill(null), ...days];
  }, [monthStart, monthEnd]);

  const isElectron = /electron/i.test(navigator.userAgent);

  return (
    <div className={`flex flex-col h-full bg-white ${isElectron ? 'rounded-none border-t-2 border-indigo-600' : 'md:rounded-3xl shadow-xl'} overflow-hidden min-h-[90vh]`}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 ${isElectron ? 'bg-indigo-600' : 'bg-indigo-100'} rounded-xl flex items-center justify-center transition-transform hover:scale-110 shadow-sm`}>
              <Wallet className={`${isElectron ? 'text-white' : 'text-indigo-600'} w-6 h-6`} />
            </div>
            <select 
              className="text-lg font-black bg-transparent outline-none cursor-pointer text-gray-800"
              value={currentLedger}
              onChange={(e) => onSetLedger(e.target.value)}
            >
              {LEDGERS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowSyncMenu(!showSyncMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-sm border ${
                isAutoSyncActive 
                ? 'bg-green-500 text-white border-green-600' 
                : hasPersistentHandle 
                  ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}
            >
              {isElectron ? <Monitor size={14} /> : <Zap size={14} fill={isAutoSyncActive ? 'currentColor' : 'none'} />}
              <span>{isAutoSyncActive ? '桌面同步中' : hasPersistentHandle ? '待唤醒同步' : '开启坚果云同步'}</span>
              <ChevronDown size={12} />
            </button>

            {showSyncMenu && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">桌面同步中心</h3>
                  <div className={`w-2 h-2 rounded-full ${isAutoSyncActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                
                <div className="space-y-3">
                  {hasPersistentHandle && !isAutoSyncActive && (
                    <button 
                      onClick={() => { onRestoreSync(); setShowSyncMenu(false); }}
                      className="w-full flex items-center gap-3 p-4 bg-amber-500 text-white hover:bg-amber-600 rounded-xl text-sm font-black transition-all shadow-lg shadow-amber-100"
                    >
                      <Power size={18} /> 激活本地连接
                    </button>
                  )}

                  {!isAutoSyncActive && (
                    <button 
                      onClick={() => { onLinkSync(); setShowSyncMenu(false); }} 
                      className="w-full flex items-center gap-3 p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100"
                    >
                      <Link size={16} /> 选择坚果云文件
                    </button>
                  )}

                  <div className={`p-3 rounded-xl border ${isAutoSyncActive ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-gray-100'}`}>
                    <p className={`text-[11px] ${isAutoSyncActive ? 'text-green-700' : 'text-gray-500'} font-bold leading-relaxed flex items-start gap-2`}>
                      <Info size={12} className="mt-0.5 shrink-0" />
                      {isAutoSyncActive 
                        ? '同步已锁定！记账后文件秒级更新，坚果云将完成云端漫游。' 
                        : '请选择位于坚果云同步目录下的 JSON 文件，以实现多端数据自动流通。'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-indigo-100">
            <Plus className="w-5 h-5" />
            <span>记一笔</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 text-red-500 mb-2 font-bold text-xs uppercase tracking-widest">
                <ArrowUpRight size={14} /> 本月支出
              </div>
              <div className="text-3xl font-black text-gray-800">¥{stats.expense.toFixed(2)}</div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 text-green-500 mb-2 font-bold text-xs uppercase tracking-widest">
                <ArrowDownLeft size={14} /> 本月收入
              </div>
              <div className="text-3xl font-black text-gray-800">¥{stats.income.toFixed(2)}</div>
            </div>
            <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-100 group transition-all">
              <div className="flex items-center gap-2 text-indigo-100 mb-2 font-bold text-xs uppercase tracking-widest">
                <Wallet size={14} /> 剩余结余
              </div>
              <div className="text-3xl font-black text-white group-hover:scale-105 transition-transform">¥{stats.balance.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-gray-800 text-sm tracking-tight flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-500" />
                收支趋势分析
              </h3>
              <div className="flex bg-gray-100 p-1.5 rounded-xl">
                <button onClick={() => setChartType('expense')} className={`px-5 py-1.5 text-[10px] font-black rounded-lg transition-all ${chartType === 'expense' ? 'bg-white shadow text-red-600' : 'text-gray-400'}`}>支出</button>
                <button onClick={() => setChartType('income')} className={`px-5 py-1.5 text-[10px] font-black rounded-lg transition-all ${chartType === 'income' ? 'bg-white shadow text-green-600' : 'text-gray-400'}`}>收入</button>
              </div>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} onMouseDown={(data) => data && data.activePayload && setSelectedDate(data.activePayload[0].payload.fullDate)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip cursor={{fill: '#f8fafc', radius: 8}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={isSameDay(entry.fullDate, selectedDate) ? (chartType === 'expense' ? '#ef4444' : '#22c55e') : (chartType === 'expense' ? '#fecaca' : '#bbf7d0')} className="cursor-pointer transition-opacity hover:opacity-80" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-black text-gray-800 mb-6 tracking-tight">支出结构比例</h3>
              <div className="h-[220px] w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryStats} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={5} dataKey="amount" stroke="none">
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {categoryStats.slice(0, 4).map(cat => (
                  <div key={cat.id} className="flex items-center justify-between text-[11px] font-black p-2 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor: cat.color}}></div><span className="text-gray-500">{cat.name}</span></div>
                    <span className="text-gray-800">¥{cat.amount.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 p-8 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-5 shadow-inner">
                <Monitor size={40} className="text-indigo-500" />
              </div>
              <h4 className="font-black text-gray-800 text-lg mb-2">桌面增强模式</h4>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed max-w-[240px]">
                您正在使用桌面版。数据直接写入您的磁盘物理位置，配合坚果云客户端可获得极致稳定的跨端体验。
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-[420px] border-l bg-white p-6 space-y-6 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 px-1">
              <button onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))} className="p-2.5 hover:bg-slate-50 rounded-xl text-gray-400 transition-all"><ChevronLeft size={20}/></button>
              <span className="font-black text-gray-800 text-base">{format(selectedMonth, 'yyyy年 M月')}</span>
              <button onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))} className="p-2.5 hover:bg-slate-50 rounded-xl text-gray-400 transition-all"><ChevronRight size={20}/></button>
            </div>
            <div className="grid grid-cols-7 text-center text-[11px] text-gray-300 mb-4 font-black tracking-widest">
              <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
            </div>
            <div className="grid grid-cols-7 gap-y-2">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="min-h-[45px]" />;
                const active = isSameDay(day, selectedDate);
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayData = dailySummary[dayKey];
                return (
                  <button 
                    key={day.toISOString()} 
                    onClick={() => setSelectedDate(day)} 
                    className={`relative min-h-[50px] w-full flex flex-col items-center py-2 transition-all rounded-2xl ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105 z-10' : 'hover:bg-slate-50'}`}
                  >
                    <span className={`text-xs font-black mb-1.5 ${active ? 'text-white' : 'text-gray-700'}`}>{format(day, 'd')}</span>
                    {(dayData?.expense > 0 || dayData?.income > 0) && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-auto ${active ? 'bg-white' : 'bg-indigo-500/40'}`}></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                {format(selectedDate, 'M月d日')} 收支明细
              </h4>
              <span className="text-[11px] font-black text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-xl">笔数: {dailyTransactions.length}</span>
            </div>
            
            {dailyTransactions.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center gap-4 bg-slate-50/50 rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <FileJson size={28} className="text-gray-200" />
                </div>
                <p className="text-xs text-gray-300 font-black uppercase tracking-widest">今天暂无流水记录</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {dailyTransactions.map(t => {
                  const cat = CATEGORIES.find(c => c.id === t.categoryId);
                  const Icon = cat ? ICON_MAP[cat.icon] : MoreHorizontal;
                  return (
                    <div key={t.id} className="group bg-white p-4.5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:border-indigo-400 hover:shadow-lg active:scale-[0.98]">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 shadow-sm ${t.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-sm text-gray-800 truncate">{cat?.name || '未分类'}</div>
                        <div className="text-[11px] text-gray-400 font-bold truncate tracking-tight">{t.note || '点击添加备注'}</div>
                      </div>
                      <div className={`font-black text-sm whitespace-nowrap ${t.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                        {t.type === 'expense' ? '-' : '+'}{t.amount.toFixed(2)}
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all -mr-1">
                        <button onClick={() => onEdit(t.id)} className="p-2.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => onDelete(t.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
