const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== DETALHE DAS FATURAS ===');
  const faturas = await prisma.fatura.findMany();
  console.log(faturas.map(f => ({
    id: f.id,
    tenantId: f.tenantId,
    cartaoId: f.cartaoId,
    mes: f.mes,
    ano: f.ano,
    status: f.status
  })));
}

main()
  .catch(e => {
    console.error('Erro:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
