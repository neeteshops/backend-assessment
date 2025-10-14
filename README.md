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
npm install