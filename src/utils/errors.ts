export class ApplicationError extends Error {
    constructor(
      message: string,
      public readonly code: string,
      public readonly statusCode: number = 500
    ) {
      super(message);
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export class InsufficientFundsError extends ApplicationError {
    constructor(userId: string) {
      super(`Insufficient funds for user ${userId}`, 'INSUFFICIENT_FUNDS', 400);
    }
  }
  
  export class DuplicateTransactionError extends ApplicationError {
    constructor(idempotentKey: string) {
      super(`Transaction with idempotent key ${idempotentKey} already processed`, 'DUPLICATE_TRANSACTION', 409);
    }
  }
  
  export class UserNotFoundError extends ApplicationError {
    constructor(userId: string) {
      super(`User ${userId} not found`, 'USER_NOT_FOUND', 404);
    }
  }
  
  export class InvalidAmountError extends ApplicationError {
    constructor(amount: string) {
      super(`Invalid amount: ${amount}`, 'INVALID_AMOUNT', 400);
    }
  }