export interface Balance {
    userId: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Transaction {
    transactionId: string;
    idempotentKey: string;
    userId: string;
    amount: number;
    type: 'credit' | 'debit';
    status: 'completed' | 'failed' | 'pending';
    createdAt: string;
    errorMessage?: string;
  }
  
  export interface GetBalanceInput {
    userId: string;
  }
  
  export interface ProcessTransactionInput {
    idempotentKey: string;
    userId: string;
    amount: string;
    type: 'credit' | 'debit';
  }
  
  export interface TransactionResult {
    success: boolean;
    newBalance?: number;
    transactionId?: string;
    error?: string;
  }