import { BalanceService } from './services/balanceService';
import { TransactionService } from './services/transactionService';
import { createTables } from './scripts/initTables';
import { seedData } from './scripts/seedData';

async function main() {
  try {
    console.log('🚀 Starting Backend Assessment...');
    
    // Initialize database
    await createTables();
    console.log('✅ Database tables initialized');
    
    // Seed initial data
    await seedData();
    console.log('✅ Initial data seeded');
    
    // Initialize services
    const balanceService = new BalanceService();
    const transactionService = new TransactionService();
    
    console.log('\n📋 Testing Balance Service...');
    
    // Test 1: Get balance for user 1
    try {
      const balance = await balanceService.getCurrentBalance({ userId: '1' });
      console.log(`✅ User 1 balance: $${balance.balance}`);
    } catch (error) {
      console.log('❌ Error getting balance:', error);
    }
    
    console.log('\n📋 Testing Transaction Service...');
    
    // Test 2: Process credit transaction
    try {
      const creditResult = await transactionService.processTransaction({
        idempotentKey: 'test-credit-1',
        userId: '1',
        amount: '50',
        type: 'credit'
      });
      
      if (creditResult.success) {
        console.log(`✅ Credit transaction successful. New balance: $${creditResult.newBalance}`);
      } else {
        console.log('❌ Credit transaction failed:', creditResult.error);
      }
    } catch (error) {
      console.log('❌ Error processing credit:', error);
    }
    
    // Test 3: Process debit transaction
    try {
      const debitResult = await transactionService.processTransaction({
        idempotentKey: 'test-debit-1',
        userId: '1',
        amount: '25',
        type: 'debit'
      });
      
      if (debitResult.success) {
        console.log(`✅ Debit transaction successful. New balance: $${debitResult.newBalance}`);
      } else {
        console.log('❌ Debit transaction failed:', debitResult.error);
      }
    } catch (error) {
      console.log('❌ Error processing debit:', error);
    }
    
    // Test 4: Test idempotency (duplicate transaction)
    try {
      const duplicateResult = await transactionService.processTransaction({
        idempotentKey: 'test-credit-1', // Same idempotent key
        userId: '1',
        amount: '50',
        type: 'credit'
      });
      
      if (duplicateResult.success) {
        console.log(`✅ Duplicate transaction handled idempotently. Balance: $${duplicateResult.newBalance}`);
      }
    } catch (error) {
      console.log('❌ Error with duplicate transaction:', error);
    }
    
    // Test 5: Test overdraft protection
    try {
      const overdraftResult = await transactionService.processTransaction({
        idempotentKey: 'test-overdraft-1',
        userId: '1',
        amount: '1000',
        type: 'debit'
      });
      
      if (!overdraftResult.success) {
        console.log(`✅ Overdraft protection working: ${overdraftResult.error}`);
      }
    } catch (error) {
      console.log('❌ Error testing overdraft:', error);
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\n💡 You can now run the Express server with: npm run start:server');
    
  } catch (error) {
    console.error('❌ Application failed to start:', error);
    process.exit(1);
  }
}

// Start the application
main();