import { TransactionService } from '../src/services/transactionService';
import { BalanceRepository } from '../src/repositories/balanceRepository';
import { TransactionRepository } from '../src/repositories/transactionRepository';
import { InsufficientFundsError, InvalidAmountError } from '../src/utils/errors';

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let mockBalanceRepository: jest.Mocked<BalanceRepository>;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    mockBalanceRepository = new BalanceRepository() as jest.Mocked<BalanceRepository>;
    mockTransactionRepository = new TransactionRepository() as jest.Mocked<TransactionRepository>;
    transactionService = new TransactionService(mockBalanceRepository, mockTransactionRepository);
  });

  describe('processTransaction', () => {
    it('should process credit transaction successfully', async () => {
      const input = {
        idempotentKey: 'credit-1',
        userId: '1',
        amount: '10',
        type: 'credit' as const
      };

      mockBalanceRepository.getBalance.mockResolvedValue({
        userId: '1',
        balance: 100,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      });

      mockBalanceRepository.updateBalanceWithTransaction.mockResolvedValue({
        userId: '1',
        balance: 110,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z'
      });

      mockTransactionRepository.createTransaction.mockResolvedValue({
        transactionId: 'txn-123',
        idempotentKey: 'credit-1',
        userId: '1',
        amount: 10,
        type: 'credit',
        status: 'completed',
        createdAt: '2023-01-02T00:00:00Z'
      });

      const result = await transactionService.processTransaction(input);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(110);
      expect(mockBalanceRepository.updateBalanceWithTransaction).toHaveBeenCalledWith(
        '1', 10, 'credit-1', 'credit-1'
      );
    });

    it('should reject debit transaction with insufficient funds', async () => {
      const input = {
        idempotentKey: 'debit-1',
        userId: '1',
        amount: '150',
        type: 'debit' as const
      };

      mockBalanceRepository.getBalance.mockResolvedValue({
        userId: '1',
        balance: 100,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      });

      const result = await transactionService.processTransaction(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient funds');
    });

    it('should reject invalid amount', async () => {
      const input = {
        idempotentKey: 'invalid-amount',
        userId: '1',
        amount: 'invalid',
        type: 'credit' as const
      };

      const result = await transactionService.processTransaction(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });

    it('should handle duplicate transactions idempotently', async () => {
      const input = {
        idempotentKey: 'duplicate-1',
        userId: '1',
        amount: '10',
        type: 'credit' as const
      };

      mockTransactionRepository.getTransactionByIdempotentKey.mockResolvedValue({
        transactionId: 'existing-txn',
        idempotentKey: 'duplicate-1',
        userId: '1',
        amount: 10,
        type: 'credit',
        status: 'completed',
        createdAt: '2023-01-01T00:00:00Z'
      });

      mockBalanceRepository.getBalance.mockResolvedValue({
        userId: '1',
        balance: 100,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      });

      const result = await transactionService.processTransaction(input);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('existing-txn');
    });
  });
});