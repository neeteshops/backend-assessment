import { BalanceRepository } from '../repositories/balanceRepository';
import { TransactionRepository } from '../repositories/transactionRepository';
import { ProcessTransactionInput, TransactionResult } from '../models/interfaces';
import { 
  InsufficientFundsError, 
  DuplicateTransactionError, 
  InvalidAmountError 
} from '../utils/errors';

export class TransactionService {
  private balanceRepository: BalanceRepository;
  private transactionRepository: TransactionRepository;

  constructor(
    balanceRepository?: BalanceRepository,
    transactionRepository?: TransactionRepository
  ) {
    this.balanceRepository = balanceRepository || new BalanceRepository();
    this.transactionRepository = transactionRepository || new TransactionRepository();
  }

  async processTransaction(input: ProcessTransactionInput): Promise<TransactionResult> {
    try {
      const { idempotentKey, userId, amount: amountStr, type } = input;

      // Validate input
      this.validateInput(input);

      const amount = this.parseAmount(amountStr, type);

      // Check for duplicate transaction using idempotent key
      try {
        const existingTransaction = await this.transactionRepository.getTransactionByIdempotentKey(idempotentKey);
        
        if (existingTransaction) {
          // Return the result of the existing transaction
          const balance = await this.balanceRepository.getBalance(userId);
          return {
            success: true,
            newBalance: balance.balance,
            transactionId: existingTransaction.transactionId
          };
        }
      } catch (error) {
        // Transaction doesn't exist, proceed with processing
      }

      // Get current balance
      let currentBalance: number;
      try {
        const balanceRecord = await this.balanceRepository.getBalance(userId);
        currentBalance = balanceRecord.balance;
      } catch (error) {
        // User doesn't exist, initialize with zero balance
        await this.balanceRepository.initializeUser(userId);
        currentBalance = 0;
      }

      // Validate debit transaction
      if (type === 'debit' && currentBalance < amount) {
        throw new InsufficientFundsError(userId);
      }

      // Process transaction
      const transactionAmount = type === 'credit' ? amount : -amount;
      
      const updatedBalance = await this.balanceRepository.updateBalanceWithTransaction(
        userId,
        transactionAmount,
        idempotentKey, // Using idempotentKey as transaction identifier
        idempotentKey
      );

      // Record the transaction
      const transaction = await this.transactionRepository.createTransaction(
        idempotentKey,
        userId,
        amount,
        type
      );

      return {
        success: true,
        newBalance: updatedBalance.balance,
        transactionId: transaction.transactionId
      };

    } catch (error) {
      if (error instanceof DuplicateTransactionError) {
        // This is a duplicate transaction, return the existing result
        const balance = await this.balanceRepository.getBalance(input.userId);
        return {
          success: true,
          newBalance: balance.balance,
          transactionId: `existing-${input.idempotentKey}`
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private validateInput(input: ProcessTransactionInput): void {
    const { userId, amount, type, idempotentKey } = input;

    if (!userId || !amount || !type || !idempotentKey) {
      throw new Error('Missing required fields: userId, amount, type, idempotentKey');
    }

    if (type !== 'credit' && type !== 'debit') {
      throw new Error('Type must be either "credit" or "debit"');
    }

    if (!this.isValidAmount(amount)) {
      throw new InvalidAmountError(amount);
    }
  }

  private isValidAmount(amount: string): boolean {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0 && /^\d+(\.\d{1,2})?$/.test(amount);
  }

  private parseAmount(amount: string, type: 'credit' | 'debit'): number {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new InvalidAmountError(amount);
    }

    return numAmount;
  }
}