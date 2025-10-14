import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export function createDynamoDBClient(): DynamoDBClient {
  const config = {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
    },
    // Add retry configuration for local development
    maxAttempts: 5,
    retryMode: 'standard'
  };

  console.log('🔌 Connecting to DynamoDB at:', config);

  return new DynamoDBClient(config);
}

export function createDynamoDBDocumentClient(): DynamoDBDocumentClient {
  const client = createDynamoDBClient();
  
  // Configure DocumentClient for easier data handling
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      convertEmptyValues: false,
      removeUndefinedValues: true,
      convertClassInstanceToMap: false,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  });
}

// Singleton instances
export const dynamoDBClient = createDynamoDBClient();
export const docClient = createDynamoDBDocumentClient();