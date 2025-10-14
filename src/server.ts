import express from 'express';
import { BalanceService } from './services/balanceService';
import { TransactionService } from './services/transactionService';
import { createTables } from './scripts/initTables';
import { seedData } from './scripts/seedData';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const balanceService = new BalanceService();
const transactionService = new TransactionService();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Backend Assessment API'
  });
});

// Get balance
app.get('/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const balance = await balanceService.getCurrentBalance({ userId });
    res.json(balance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Process transaction
app.post('/transaction', async (req, res) => {
  try {
    const { idempotentKey, userId, amount, type } = req.body;
    
    if (!idempotentKey || !userId || !amount || !type) {
      return res.status(400).json({ 
        error: 'Missing required fields: idempotentKey, userId, amount, type' 
      });
    }

    const result = await transactionService.processTransaction({
      idempotentKey,
      userId,
      amount,
      type
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await createTables();
    await seedData();
    
    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
      console.log(`📚 Endpoints:`);
      console.log(`   GET  /health`);
      console.log(`   GET  /balance/:userId`);
      console.log(`   POST /transaction`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app };