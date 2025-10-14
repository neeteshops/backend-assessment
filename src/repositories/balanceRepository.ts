import { GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Balance } from '../models/interfaces';
import { UserNotFoundError, DuplicateTransactionError } from '../utils/errors';
import { docClient } from '../utils/dynamodbClient';

export class BalanceRepository {
  private readonly tableName = 'Balances';

  async getBalance(userId: string): Promise<Balance> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { userId }
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      throw new UserNotFoundError(userId);
    }

    return result.Item as Balance;
  }

  async updateBalanceWithTransaction(
    userId: string,
    amount: number,
    transactionId: string,
    idempotentKey: string
  ): Promise<Balance> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { userId },
      UpdateExpression: `
        SET 
          balance = if_not_exists(balance, :zero) + :amount,
          updatedAt = :now,
          #latestTransaction = :transactionId
      `,
      ConditionExpression: 
        'attribute_not_exists(#latestTransaction) OR #latestTransaction <> :transactionId',
      ExpressionAttributeNames: {
        '#latestTransaction': 'latestTransaction'
      },
      ExpressionAttributeValues: {
        ':amount': amount,
        ':now': new Date().toISOString(),
        ':transactionId': transactionId,
        ':zero': 0
      },
      ReturnValues: 'ALL_NEW'
    });

    try {
      const result = await docClient.send(command);
      return result.Attributes as Balance;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new DuplicateTransactionError(idempotentKey);
      }
      throw error;
    }
  }

  async initializeUser(userId: string): Promise<Balance> {
    const now = new Date().toISOString();
    const balance: Balance = {
      userId,
      balance: 0,
      createdAt: now,
      updatedAt: now
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: balance,
      ConditionExpression: 'attribute_not_exists(userId)'
    });

    try {
      await docClient.send(command);
      return balance;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        // User already exists, return current balance
        return this.getBalance(userId);
      }
      throw error;
    }
  }

  async createBalance(userId: string, initialBalance: number = 0): Promise<Balance> {
    const now = new Date().toISOString();
    const balance: Balance = {
      userId,
      balance: initialBalance,
      createdAt: now,
      updatedAt: now
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: balance
    });

    await docClient.send(command);
    return balance;
  }
}