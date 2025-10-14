import { BalanceService } from '../src/services/balanceService';
import { BalanceRepository } from '../src/repositories/balanceRepository';
import { UserNotFoundError } from '../src/utils/errors';

// Mock the BalanceRepository
jest.mock('../src/repositories/balanceRepository');

describe('BalanceService', () => {
  let balanceService: BalanceService;
  let mockBalanceRepository: jest.Mocked<BalanceRepository>;

  beforeEach(() => {
    mockBalanceRepository = new BalanceRepository() as jest.Mocked<BalanceRepository>;
    balanceService = new BalanceService(mockBalanceRepository);
  });

  describe('getCurrentBalance', () => {
    it('should return balance for existing user', async () => {
      const mockBalance = {
        userId: '1',
        balance: 100,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      mockBalanceRepository.getBalance.mockResolvedValue(mockBalance);

      const result = await balanceService.getCurrentBalance({ userId: '1' });

      expect(result).toEqual({ balance: 100 });
      expect(mockBalanceRepository.getBalance).toHaveBeenCalledWith('1');
    });

    it('should initialize user with zero balance when not found', async () => {
      mockBalanceRepository.getBalance.mockRejectedValue(new UserNotFoundError('1'));
      mockBalanceRepository.initializeUser.mockResolvedValue({
        userId: '1',
        balance: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      });

      const result = await balanceService.getCurrentBalance({ userId: '1' });

      expect(result).toEqual({ balance: 0 });
      expect(mockBalanceRepository.initializeUser).toHaveBeenCalledWith('1');
    });

    it('should throw error for missing userId', async () => {
      await expect(balanceService.getCurrentBalance({ userId: '' }))
        .rejects
        .toThrow('User ID is required');
    });
  });
});