
import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Wallet, Image as ImageIcon, Flag, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { CATEGORIES, ICON_MAP, ACCOUNTS, LEDGERS } from '../constants';
// Fix: Removed parseISO as it is reported missing by the compiler
import { format } from 'date-fns';

interface TransactionFormProps {
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  initialData: Transaction | null;
  currentLedger: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, onSave, initialData, currentLedger }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || CATEGORIES.filter(c => c.type === (initialData?.type || 'expense'))[0].id);
  const [note, setNote] = useState(initialData?.note || '');
  const [account, setAccount] = useState(initialData?.account || ACCOUNTS[0]);
  const [toAccount, setToAccount] = useState(initialData?.toAccount || ACCOUNTS[1]);
  const [ledger, setLedger] = useState(initialData?.ledger || currentLedger);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString());
  const [isFlagged, setIsFlagged] = useState(initialData?.isFlagged || false);
  const [amountStr, setAmountStr] = useState(initialData?.amount.toString() || '0');
  const [evaluating, setEvaluating] = useState(false);

  // Sync category when type changes
  useEffect(() => {
    if (!initialData) {
      const firstCat = CATEGORIES.find(c => c.type === type);
      if (firstCat) setCategoryId(firstCat.id);
    }
  }, [type, initialData]);

  const handleKeyClick = (key: string) => {
    if (key === 'delete') {
      setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      return;
    }
    
    if (key === '.') {
      if (amountStr.includes('.') && !/[+\-]/.test(amountStr.slice(amountStr.lastIndexOf('.') + 1))) {
         // Only allow one dot per number block
         return;
      }
    }

    setAmountStr(prev => {
      if (prev === '0' && !['+', '-', '.'].includes(key)) return key;
      return prev + key;
    });
  };

  const evaluateAmount = (str: string): number => {
    try {
      // Basic math evaluation for + and -
      const cleanStr = str.replace(/[^-+0-9.]/g, '');
      // Functional approach to avoid eval()
      const parts = cleanStr.split(/([+-])/);
      let total = parseFloat(parts[0]) || 0;
      for(let i=1; i<parts.length; i+=2) {
        const op = parts[i];
        const val = parseFloat(parts[i+1]) || 0;
        if(op === '+') total += val;
        if(op === '-') total -= val;
      }
      return total;
    } catch {
      return 0;
    }
  };

  const handleSave = (keepOpen = false) => {
    const amount = evaluateAmount(amountStr);
    if (amount <= 0 && type !== 'transfer') {
      alert('金额必须大于 0');
      return;
    }

    const transaction: Transaction = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      type,
      amount,
      categoryId,
      note,
      account,
      toAccount: type === 'transfer' ? toAccount : undefined,
      ledger,
      date,
      hasImage: false,
      isFlagged
    };

    onSave(transaction);
    if (keepOpen) {
      setAmountStr('0');
      // Keep category and date
    }
  };

  const mainColor = type === 'expense' ? 'red' : type === 'income' ? 'green' : 'blue';
  const colorHex = { red: '#ef4444', green: '#22c55e', blue: '#3b82f6' }[mainColor];

  return (
    <div className="flex flex-col h-full bg-white md:rounded-3xl shadow-xl overflow-hidden min-h-[90vh]">
      {/* Top Navigation */}
      <header className="px-4 py-3 flex items-center justify-between border-b bg-white">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-500" /></button>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(['expense', 'income', 'transfer'] as TransactionType[]).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-6 py-1.5 text-sm font-bold rounded-lg transition-all ${
                type === t 
                  ? `bg-white shadow text-${t === 'expense' ? 'red' : t === 'income' ? 'green' : 'blue'}-500` 
                  : 'text-gray-500'
              }`}
            >
              {t === 'expense' ? '支出' : t === 'income' ? '收入' : '转账'}
            </button>
          ))}
        </div>
        
        <div className="w-10"></div> {/* Spacer */}
      </header>

      {/* Category Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-y-6">
          {CATEGORIES.filter(c => c.type === (type === 'transfer' ? 'expense' : type)).map(cat => {
            const Icon = ICON_MAP[cat.icon] || MoreHorizontal;
            const active = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200
                  ${active ? 'shadow-lg scale-110' : 'bg-gray-50 group-hover:bg-gray-100'}
                `} style={{ backgroundColor: active ? colorHex : undefined, color: active ? 'white' : '#64748b' }}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-xs font-medium transition-colors ${active ? `text-${mainColor}-500 font-bold` : 'text-gray-500'}`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gray-50 border-t">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <input 
              type="text" 
              placeholder="点此输入备注..." 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 font-medium"
            />
            <div className={`text-3xl font-bold text-${mainColor}-500`}>
              {amountStr}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {type === 'transfer' ? (
              <>
                <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-gray-100">
                  <span className="text-gray-400">从</span>
                  <select value={account} onChange={e => setAccount(e.target.value)} className="outline-none bg-transparent">{ACCOUNTS.map(a => <option key={a}>{a}</option>)}</select>
                </div>
                <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-gray-100">
                  <span className="text-gray-400">到</span>
                  <select value={toAccount} onChange={e => setToAccount(e.target.value)} className="outline-none bg-transparent">{ACCOUNTS.map(a => <option key={a}>{a}</option>)}</select>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-gray-100">
                <Wallet size={14} className="text-gray-400" />
                <select value={account} onChange={e => setAccount(e.target.value)} className="outline-none bg-transparent">{ACCOUNTS.map(a => <option key={a}>{a}</option>)}</select>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-gray-100">
              <span className="text-gray-400">账本</span>
              <select value={ledger} onChange={e => setLedger(e.target.value)} className="outline-none bg-transparent">{LEDGERS.map(l => <option key={l}>{l}</option>)}</select>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-gray-100 cursor-pointer">
              <CalendarIcon size={14} className="text-gray-400" />
              {/* Fix: Replaced parseISO(date) with new Date(date) */}
              <input type="date" value={format(new Date(date), 'yyyy-MM-dd')} onChange={e => setDate(new Date(e.target.value).toISOString())} className="outline-none bg-transparent text-xs" />
            </div>
            <button className="p-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-gray-400 hover:text-blue-500 transition-colors"><ImageIcon size={14} /></button>
            <button 
              onClick={() => setIsFlagged(!isFlagged)}
              className={`p-1.5 bg-white rounded-full shadow-sm border border-gray-100 transition-colors ${isFlagged ? 'text-orange-500' : 'text-gray-400'}`}
            >
              <Flag size={14} fill={isFlagged ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Custom Numeric Keypad */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-gray-200">
          {[
            '1', '2', '3', 'delete',
            '4', '5', '6', '-',
            '7', '8', '9', '+',
            '再记', '0', '.', '保存'
          ].map(k => {
            const isSave = k === '保存';
            const isAgain = k === '再记';
            const isDelete = k === 'delete';
            const isOp = ['+', '-', 'delete'].includes(k);

            return (
              <button
                key={k}
                onClick={() => {
                  if (isSave) handleSave(false);
                  else if (isAgain) handleSave(true);
                  else handleKeyClick(k);
                }}
                className={`h-16 flex items-center justify-center text-xl font-bold transition-all active:scale-95
                  ${isSave ? `bg-${mainColor}-500 text-white row-span-1` : 'bg-white text-gray-800'}
                  ${isAgain ? 'text-gray-500 text-sm' : ''}
                  ${isOp ? 'bg-gray-50' : ''}
                `}
                style={{ backgroundColor: isSave ? colorHex : undefined }}
              >
                {isDelete ? <X size={24} /> : k}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
