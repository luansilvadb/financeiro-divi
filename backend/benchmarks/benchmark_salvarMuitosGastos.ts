import { FinanceiroService } from '../src/financeiro/financeiro.service';
import { serializeBigInt } from '../src/shared/utils/serialization';

const SLEEP_MS = 10;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const mockTx = {
  divisaoGasto: {
    deleteMany: async () => {
      await sleep(SLEEP_MS);
      return { count: 0 };
    },
    createMany: async () => {
      await sleep(SLEEP_MS);
      return { count: 0 };
    }
  },
  gasto: {
    upsert: async () => {
      await sleep(SLEEP_MS);
      return { id: '1' };
    },
    findUnique: async () => {
      await sleep(SLEEP_MS);
      return { id: '1', divisoes: [] };
    }
  }
};

const mockPrisma = {
  $transaction: async (fn: any) => {
    if (typeof fn === 'function') {
      return await fn(mockTx);
    }
    // For transactions that take an array of promises
    return await Promise.all(fn);
  },
  gasto: {
    findUnique: async () => {
      await sleep(SLEEP_MS);
      return { id: '1', divisoes: [] };
    }
  }
} as any;

const mockAuth = {} as any;
const mockGateway = {
  notificarAlteracao: () => {}
} as any;

const service = new FinanceiroService(mockPrisma, mockAuth, mockGateway);

async function runBenchmark() {
  const gastos = Array.from({ length: 10 }, (_, i) => ({
    id: `gasto-${i}`,
    descricao: `Gasto ${i}`,
    valorTotalCentavos: 1000,
    divisoes: [{ membroId: 'm1', valorCentavos: 1000 }]
  }));

  console.log('Starting benchmark with 10 gastos...');
  const start = Date.now();
  await service.salvarMuitosGastos('tenant-1', gastos);
  const end = Date.now();
  console.log(`Time taken: ${end - start}ms`);
}

runBenchmark().catch(console.error);
