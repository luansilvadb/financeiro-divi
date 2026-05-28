const fetch = require('node-fetch');

async function runTest() {
  const baseUrl = 'http://localhost:3000';
  const username = `user_${Date.now()}`;
  const password = 'password123';

  console.log(`=== INICIANDO TESTE REST API COM USUÁRIO: ${username} ===`);

  // 1. Registrar
  console.log('\n1. Registrando usuário...');
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!regRes.ok) {
    const err = await regRes.json();
    throw new Error(`Erro ao registrar: ${JSON.stringify(err)}`);
  }
  const regData = await regRes.json();
  console.log('Registrado com sucesso:', regData);

  // 2. Fazer Login para obter token JWT
  console.log('\n2. Fazendo login...');
  const logRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!logRes.ok) {
    const err = await logRes.json();
    throw new Error(`Erro ao logar: ${JSON.stringify(err)}`);
  }
  const logData = await logRes.json();
  console.log('Logado com sucesso. Token obtido:', logData.access_token);
  const token = logData.access_token;
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 3. Criar Tenant (Casa)
  console.log('\n3. Criando tenant...');
  const tenantRes = await fetch(`${baseUrl}/financeiro/tenants`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Casa do Agente' })
  });
  if (!tenantRes.ok) {
    const err = await tenantRes.json();
    throw new Error(`Erro ao criar tenant: ${JSON.stringify(err)}`);
  }
  const tenantData = await tenantRes.json();
  console.log('Tenant criado:', tenantData);
  const tenantId = tenantData.id;

  const headersWithTenant = {
    ...authHeaders,
    'X-Tenant-ID': tenantId
  };

  // 4. Listar membros para ver se o fundador foi criado
  console.log('\n4. Listando membros...');
  const membrosRes = await fetch(`${baseUrl}/financeiro/membros`, {
    headers: headersWithTenant
  });
  if (!membrosRes.ok) {
    const err = await membrosRes.json();
    throw new Error(`Erro ao listar membros: ${JSON.stringify(err)}`);
  }
  const membros = await membrosRes.json();
  console.log('Membros da casa:', membros);
  const fundadorId = membros[0].id;

  // 5. Listar faturas
  console.log('\n5. Listando faturas...');
  const fatRes = await fetch(`${baseUrl}/financeiro/faturas`, {
    headers: headersWithTenant
  });
  if (!fatRes.ok) {
    const err = await fatRes.json();
    throw new Error(`Erro ao listar faturas: ${JSON.stringify(err)}`);
  }
  const faturas = await fatRes.json();
  console.log('Faturas encontradas:', faturas);

  // Se não há faturas, vamos criar uma para testar
  let faturaId = `PIX_DEFAULT_ID-5-2026`;
  const mes = 5;
  const ano = 2026;
  
  console.log('\n6. Criando/salvando fatura...');
  const saveFatRes = await fetch(`${baseUrl}/financeiro/faturas`, {
    method: 'POST',
    headers: headersWithTenant,
    body: JSON.stringify({
      id: faturaId,
      cartaoId: 'PIX_DEFAULT_ID',
      mes,
      ano,
      responsavelId: fundadorId,
      status: 'ABERTA'
    })
  });
  if (!saveFatRes.ok) {
    const err = await saveFatRes.json();
    throw new Error(`Erro ao salvar fatura: ${JSON.stringify(err)}`);
  }
  console.log('Fatura salva com sucesso.');

  // 7. Criar um Gasto
  console.log('\n7. Criando Gasto...');
  const gastoPayload = {
    id: `gasto-${Date.now()}`,
    faturaId: faturaId,
    descricao: 'Pizza do Agente',
    valorTotalCentavos: 5000,
    compradorId: fundadorId,
    installments: 1,
    totalInstallments: 1,
    isLoan: false,
    borrowerId: null,
    recurringBillId: null,
    isSettlement: false,
    settlementDetails: null,
    method: 'pix',
    cardOwnerId: null,
    grupoParcelasId: null,
    divisoes: [
      {
        membroId: fundadorId,
        valorCentavos: 5000
      }
    ]
  };

  const saveGastoRes = await fetch(`${baseUrl}/financeiro/gastos`, {
    method: 'POST',
    headers: headersWithTenant,
    body: JSON.stringify(gastoPayload)
  });
  if (!saveGastoRes.ok) {
    const err = await saveGastoRes.json();
    throw new Error(`Erro ao salvar gasto: ${JSON.stringify(err)}`);
  }
  console.log('Gasto salvo com sucesso:', await saveGastoRes.json());

  // 8. Listar gastos
  console.log('\n8. Listando gastos do tenant...');
  const listGastosRes = await fetch(`${baseUrl}/financeiro/gastos`, {
    headers: headersWithTenant
  });
  if (!listGastosRes.ok) {
    const err = await listGastosRes.json();
    throw new Error(`Erro ao listar gastos: ${JSON.stringify(err)}`);
  }
  const gastos = await listGastosRes.json();
  console.log('Gastos do tenant:', gastos);

  console.log('\n=== TESTE FINALIZADO COM SUCESSO! O BACKEND FUNCIONA PERFEITAMENTE! ===');
}

runTest().catch(e => {
  console.error('\n❌ O TESTE FALHOU:', e);
});
