
import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import { Transaction } from './types';

// Simple helper to store/retrieve the file handle from IndexedDB
const DB_NAME = 'FinanceSyncDB';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'nutstore_file_handle';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [currentLedger, setCurrentLedger] = useState('初始账本');
  
  const [autoSyncHandle, setAutoSyncHandle] = useState<any | null>(null);
  const [hasPersistentHandle, setHasPersistentHandle] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check environment and saved handle on mount
  useEffect(() => {
    // Detect if running in Electron
    const isElectron = /electron/i.test(navigator.userAgent);
    setIsDesktop(isElectron);

    const checkHandle = async () => {
      try {
        const db = await openDB();
        const handle = await getFromDB(db, HANDLE_KEY);
        if (handle) {
          setHasPersistentHandle(true);
          // In Desktop mode, try to auto-request permission to reduce clicks
          if (isElectron) {
            console.log('Desktop mode detected: Auto-warmup sync');
          }
        }
      } catch (e) {
        console.warn('Sync handle initialization failed');
      }
    };
    checkHandle();
  }, []);

  // Real-time Auto-save logic
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    if (autoSyncHandle) {
      saveToLinkedFile(transactions);
    }
  }, [transactions, autoSyncHandle]);

  const saveToLinkedFile = async (data: Transaction[]) => {
    if (!autoSyncHandle) return;
    try {
      const writable = await autoSyncHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      console.log('Desktop Sync: Success');
    } catch (err: any) {
      console.error('Sync failed:', err);
      if (err.name === 'NotAllowedError') {
        setAutoSyncHandle(null);
      }
    }
  };

  const handleSaveTransaction = (transaction: Transaction) => {
    let newTransactions;
    if (editingTransaction) {
      newTransactions = transactions.map(t => t.id === editingTransaction.id ? transaction : t);
    } else {
      newTransactions = [transaction, ...transactions];
    }
    setTransactions(newTransactions);
    setView('dashboard');
    setEditingTransaction(null);
  };

  // --- IndexedDB Helpers ---
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const saveToDB = (db: IDBDatabase, key: string, value: any) => {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve(true);
    });
  };

  const getFromDB = (db: IDBDatabase, key: string) => {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result);
    });
  };

  // --- Sync Actions ---
  const onLinkNewFile = async () => {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: '坚果云账单数据', accept: { 'application/json': ['.json'] } }],
        multiple: false
      });
      
      if ((await handle.requestPermission({ mode: 'readwrite' })) !== 'granted') return;

      const db = await openDB();
      await saveToDB(db, HANDLE_KEY, handle);
      
      const file = await handle.getFile();
      const content = await file.text();
      try {
        const data = JSON.parse(content);
        if (Array.isArray(data)) setTransactions(data);
      } catch(e) { console.error('Initial data load failed'); }
      
      setAutoSyncHandle(handle);
      setHasPersistentHandle(true);
      alert('已关联！桌面版将为您提供更稳定的同步体验。');
    } catch (err: any) {
      if (err.name !== 'AbortError') alert('关联失败: ' + err.message);
    }
  };

  const onRestoreSync = async () => {
    try {
      const db = await openDB();
      const handle = await getFromDB(db, HANDLE_KEY);
      if (!handle) return;

      if ((await (handle as any).requestPermission({ mode: 'readwrite' })) === 'granted') {
        const file = await (handle as any).getFile();
        const content = await file.text();
        const data = JSON.parse(content);
        if (Array.isArray(data)) setTransactions(data);
        
        setAutoSyncHandle(handle);
      }
    } catch (err: any) {
      alert('同步失效，请重新关联坚果云文件。');
      setHasPersistentHandle(false);
    }
  };

  return (
    <div className={`min-h-screen max-w-6xl mx-auto ${isDesktop ? 'md:p-2' : 'md:p-4'} p-0`}>
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const data = JSON.parse(ev.target?.result as string);
              if (Array.isArray(data)) setTransactions(data);
            } catch (err) { alert('解析失败'); }
          };
          reader.readAsText(file);
        }
      }} />
      
      {view === 'dashboard' ? (
        <Dashboard 
          transactions={transactions.filter(t => t.ledger === currentLedger)} 
          currentLedger={currentLedger}
          onSetLedger={setCurrentLedger}
          onAdd={() => { setEditingTransaction(null); setView('form'); }}
          onEdit={(id) => {
            const t = transactions.find(item => item.id === id);
            if (t) { setEditingTransaction(t); setView('form'); }
          }}
          onDelete={(id) => {
            if (confirm('确定删除该笔记录？')) setTransactions(transactions.filter(t => t.id !== id));
          }}
          onExport={() => {}} 
          onImport={() => fileInputRef.current?.click()}
          onLinkSync={onLinkNewFile}
          onRestoreSync={onRestoreSync}
          isAutoSyncActive={!!autoSyncHandle}
          hasPersistentHandle={hasPersistentHandle}
        />
      ) : (
        <TransactionForm 
          onClose={() => setView('dashboard')}
          onSave={handleSaveTransaction}
          initialData={editingTransaction}
          currentLedger={currentLedger}
        />
      )}
    </div>
  );
};

export default App;
