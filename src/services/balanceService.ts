import { BalanceRepository } from '../repositories/balanceRepository';
import { GetBalanceInput } from '../models/interfaces';
import { UserNotFoundError } from '../utils/errors';

export class BalanceService {
  private balanceRepository: BalanceRepository;

  constructor(balanceRepository?: BalanceRepository) {
    this.balanceRepository = balanceRepository || new BalanceRepository();
  }

  async getCurrentBalance(input: GetBalanceInput): Promise<{ balance: number }> {
    try {
      const { userId } = input;
      
      if (!userId) {
        throw new Error('User ID is required');
      }

      const balanceRecord = await this.balanceRepository.getBalance(userId);
      
      return {
        balance: balanceRecord.balance
      };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        // Initialize user with zero balance if not found
        await this.balanceRepository.initializeUser(input.userId);
        return { balance: 0 };
      }
      throw error;
    }
  }
}