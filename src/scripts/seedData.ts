import { BalanceRepository } from '../repositories/balanceRepository';

async function seedData() {
  try {
    console.log('Seeding initial data...');
    
    const balanceRepository = new BalanceRepository();

    // Create some test users
    const testUsers = [
      { userId: '1', initialBalance: 100 },
      { userId: '2', initialBalance: 50 },
      { userId: '3', initialBalance: 200 }
    ];

    for (const user of testUsers) {
      try {
        await balanceRepository.createBalance(user.userId, user.initialBalance);
        console.log(`✅ Created user ${user.userId} with balance ${user.initialBalance}`);
      } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') {
          console.log(`✅ User ${user.userId} already exists`);
        } else {
          throw error;
        }
      }
    }

    console.log('🎉 Data seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedData();
}

export { seedData };