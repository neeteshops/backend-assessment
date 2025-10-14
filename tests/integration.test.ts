import { BalanceService } from '../src/services/balanceService';
import { TransactionService } from '../src/services/transactionService';
import { createTables } from '../src/scripts/initTables';

describe('Integration Tests', () => {
  let balanceService: BalanceService;
  let transactionService: TransactionService;

  beforeAll(async () => {
    // Initialize database tables
    await createTables();
    
    balanceService = new BalanceService();
    transactionService = new TransactionService();
  }, 30000);

  beforeEach(async () => {
    // Clean up and reset between tests if needed
  });

  test('should process credit and debit transactions correctly', async () => {
    const userId = 'test-user-1';

    // Initial balance should be 0 for new user
    const initialBalance = await balanceService.getCurrentBalance({ userId });
    expect(initialBalance.balance).toBe(0);

    // Process credit transaction
    const creditResult = await transactionService.processTransaction({
      idempotentKey: 'credit-1',
      userId,
      amount: '100',
      type: 'credit'
    });

    expect(creditResult.success).toBe(true);
    expect(creditResult.newBalance).toBe(100);

    // Process debit transaction
    const debitResult = await transactionService.processTransaction({
      idempotentKey: 'debit-1',
      userId,
      amount: '50',
      type: 'debit'
    });

    expect(debitResult.success).toBe(true);
    expect(debitResult.newBalance).toBe(50);

    // Verify final balance
    const finalBalance = await balanceService.getCurrentBalance({ userId });
    expect(finalBalance.balance).toBe(50);
  });

  test('should handle duplicate transactions idempotently', async () => {
    const userId = 'test-user-2';
    const idempotentKey = 'duplicate-test';

    // First transaction
    const firstResult = await transactionService.processTransaction({
      idempotentKey,
      userId,
      amount: '75',
      type: 'credit'
    });

    expect(firstResult.success).toBe(true);
    const firstBalance = firstResult.newBalance;

    // Duplicate transaction with same idempotent key
    const duplicateResult = await transactionService.processTransaction({
      idempotentKey,
      userId,
      amount: '75',
      type: 'credit'
    });

    expect(duplicateResult.success).toBe(true);
    expect(duplicateResult.newBalance).toBe(firstBalance); // Balance should not change
  });

  test('should prevent overdraft', async () => {
    const userId = 'test-user-3';

    // Try to debit more than balance
    const result = await transactionService.processTransaction({
      idempotentKey: 'overdraft-test',
      userId,
      amount: '100',
      type: 'debit'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient funds');
  });
});