const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const JWT_SECRET = "super-secret-key-12345";
const ADMIN_USER_ID = "06eddd2a-9b9a-44b0-b1d0-b202de63c944";
const TENANT_MOTA = "b1e0dbe3-1e0b-48ee-8d1a-020180f18d3b";
const TENANT_SILVA = "af5bfac3-9058-4259-9841-97d611804985";

async function run() {
  // Gerar o token JWT para o admin
  const payload = { sub: ADMIN_USER_ID, username: 'admin' };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  console.log('JWT Token gerado para o admin:', token);

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  async function testTenant(tenantId, label) {
    console.log(`\n=== TESTANDO TENANT: ${label} (${tenantId}) ===`);
    const headers = { ...authHeaders, 'X-Tenant-ID': tenantId };

    try {
      // 1. Get membros
      const memRes = await fetch(`http://localhost:3000/financeiro/membros`, { headers });
      console.log('Membros:', memRes.status, await memRes.json().catch(() => ({})));

      // 2. Get faturas
      const fatRes = await fetch(`http://localhost:3000/financeiro/faturas`, { headers });
      console.log('Faturas:', fatRes.status, await fatRes.json().catch(() => ({})));

      // 3. Get gastos
      const gasRes = await fetch(`http://localhost:3000/financeiro/gastos`, { headers });
      console.log('Gastos:', gasRes.status, await gasRes.json().catch(() => ({})));
    } catch (e) {
      console.error('Erro na requisição:', e);
    }
  }

  await testTenant(TENANT_MOTA, 'Família Mota');
  await testTenant(TENANT_SILVA, 'Família Silva');
}

run();
