
export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note: string;
  account: string;
  toAccount?: string; // For transfers
  ledger: string;
  date: string; // ISO string
  hasImage: boolean;
  isFlagged: boolean;
}

export interface MonthlyStats {
  income: number;
  expense: number;
  balance: number;
}
