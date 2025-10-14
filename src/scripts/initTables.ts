import { 
    DynamoDBClient, 
    CreateTableCommand, 
    CreateTableCommandInput,
    ScalarAttributeType 
  } from '@aws-sdk/client-dynamodb';
  import { dynamoDBClient } from '../utils/dynamodbClient';
  
  async function createTables() {
    try {
      console.log('Creating DynamoDB tables...');
  
      // Balances Table with proper typing
      const balancesTableParams: CreateTableCommandInput = {
        TableName: 'Balances',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' } // Partition key
        ],
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' as ScalarAttributeType }
        ],
        BillingMode: 'PAY_PER_REQUEST',
      };
  
      // Transactions Table with proper typing
      const transactionsTableParams: CreateTableCommandInput = {
        TableName: 'Transactions',
        KeySchema: [
          { AttributeName: 'idempotentKey', KeyType: 'HASH' } // Partition key
        ],
        AttributeDefinitions: [
          { AttributeName: 'idempotentKey', AttributeType: 'S' as ScalarAttributeType }
        ],
        BillingMode: 'PAY_PER_REQUEST',
      };
  
      // Create Balances table
      try {
        await dynamoDBClient.send(new CreateTableCommand(balancesTableParams));
        console.log('✅ Balances table created successfully');
      } catch (error: any) {
        if (error.name === 'ResourceInUseException') {
          console.log('✅ Balances table already exists');
        } else {
          console.error('❌ Error creating Balances table:', error);
          throw error;
        }
      }
  
      // Create Transactions table
      try {
        await dynamoDBClient.send(new CreateTableCommand(transactionsTableParams));
        console.log('✅ Transactions table created successfully');
      } catch (error: any) {
        if (error.name === 'ResourceInUseException') {
          console.log('✅ Transactions table already exists');
        } else {
          console.error('❌ Error creating Transactions table:', error);
          throw error;
        }
      }
  
      console.log('🎉 All tables created successfully!');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      process.exit(1);
    }
  }
  
  // Run if called directly
  if (require.main === module) {
    createTables();
  }
  
  export { createTables };