# Backend Assessment Solution

A TypeScript-based solution for balance retrieval and transaction processing with DynamoDB.

## Features

- **Balance Retrieval**: Get current user balance
- **Transaction Processing**: Handle credit/debit transactions
- **Idempotency**: Prevent duplicate transactions using idempotent keys
- **Race Condition Prevention**: Atomic operations to prevent race conditions
- **Error Handling**: Comprehensive error handling and validation
- **Testing**: Unit and integration tests

## Architecture

- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Dependency Injection**: Testable and maintainable code
- **Error Hierarchy**: Structured error handling

## Setup

1. Install dependencies:
```bash
# 1. Install dependencies
npm install

# 2. Start DynamoDB Local (you need Docker for this)
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local

# 4. run the API server
npm run dev:server



#try this apis

# Get balance
curl http://localhost:3000/balance/1

# Process credit transaction
curl -X POST http://localhost:3000/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "idempotentKey": "curl-test-1",
    "userId": "1",
    "amount": "10",
    "type": "credit"
  }'

# Process debit transaction
curl -X POST http://localhost:3000/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "idempotentKey": "test-debit-1",
    "userId": "1",
    "amount": "10",
    "type": "debit"
  }'

#if you want to run test cases

# Run only unit tests (fast)
npm run test:unit

# Run only integration tests (requires DynamoDB)
npm run test:integration

# Run all tests
npm test
  
