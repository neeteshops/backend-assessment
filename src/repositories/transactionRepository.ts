import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { Transaction } from '../models/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from '../utils/dynamodbClient';

export class TransactionRepository {
  private readonly tableName = 'Transactions';

  async createTransaction(
    idempotentKey: string,
    userId: string,
    amount: number,
    type: 'credit' | 'debit'
  ): Promise<Transaction> {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      transactionId: uuidv4(),
      idempotentKey,
      userId,
      amount,
      type,
      status: 'completed',
      createdAt: now
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: transaction,
      ConditionExpression: 'attribute_not_exists(idempotentKey)'
    });

    try {
      await docClient.send(command);
      return transaction;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        // Transaction already exists, return the existing one
        return this.getTransactionByIdempotentKey(idempotentKey);
      }
      throw error;
    }
  }

  async getTransactionByIdempotentKey(idempotentKey: string): Promise<Transaction> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { idempotentKey }
    });

    const result = await docClient.send(command);
    
    if (!result.Item) {
      throw new Error(`Transaction not found for idempotent key: ${idempotentKey}`);
    }

    return result.Item as Transaction;
  }
}