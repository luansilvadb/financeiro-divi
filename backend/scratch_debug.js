const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== DADOS DO BANCO DE DADOS ===');
  
  const tenants = await prisma.tenant.findMany();
  console.log('\nTENANTS (Casas):', JSON.stringify(tenants, null, 2));

  const usuarios = await prisma.usuario.findMany({
    select: { id: true, username: true }
  });
  console.log('\nUSUÁRIOS:', JSON.stringify(usuarios, null, 2));

  const membros = await prisma.membroCasa.findMany();
  console.log('\nMEMBROS DE CASA:', JSON.stringify(membros, null, 2));

  const cartoes = await prisma.cartao.findMany();
  console.log('\nCARTÕES:', JSON.stringify(cartoes, null, 2));

  const faturas = await prisma.fatura.findMany();
  console.log('\nFATURAS:', JSON.stringify(faturas, null, 2));

  const gastos = await prisma.gasto.findMany({
    include: { divisoes: true }
  });
  console.log('\nGASTOS (Despesas):', JSON.stringify(gastos, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));
}

main()
  .catch(e => {
    console.error('Erro ao executar query:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
