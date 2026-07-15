package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/luansilvadb/financeiro-divi/backend-go/internal/dto"
	"github.com/luansilvadb/financeiro-divi/backend-go/internal/model"
)

// smokeTestSuite simula todo o fluxo de uso do app:
// register → login → criar tenant → criar membro → criar cartão →
// criar gasto → listar → atualizar membro → atualizar gasto
func TestSmokeFluxoCompleto(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := setupFinanceiroHandler()

	r := gin.New()

	// --- Rotas públicas de auth ---
	r.POST("/api/auth/register", func(c *gin.Context) {
		var req dto.RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, dto.AuthResponse{
			Token: "jwt-token-" + req.Email,
			User:  dto.UserProfile{ID: uuid.New().String(), Email: req.Email, Nome: req.Nome},
		})
	})

	r.POST("/api/auth/login", func(c *gin.Context) {
		var req dto.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, dto.AuthResponse{
			Token: "jwt-token-" + req.Email,
			User:  dto.UserProfile{ID: uuid.New().String(), Email: req.Email, Nome: "Usuário Teste"},
		})
	})

	// --- Rotas protegidas (tenant required) ---
	tenantGroup := r.Group("/api")
	tenantGroup.Use(func(c *gin.Context) {
		c.Set("tenantID", "tenant-smoke-1")
		c.Set("userID", "user-smoke-1")
		c.Next()
	})
	{
		tenantGroup.POST("/tenants", func(c *gin.Context) {
			var req dto.CreateTenantRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
				return
			}
			c.JSON(http.StatusCreated, dto.TenantResponse{
				ID:         "tenant-smoke-1",
				Name:       req.Name,
				InviteCode: "SMOKE123",
			})
		})

		// --- Rotas write (role required) ---
		writeGroup := tenantGroup.Group("")
		writeGroup.Use(func(c *gin.Context) {
			c.Set("userRole", string(model.RoleAdmin))
			c.Next()
		})
		{
			writeGroup.POST("/membros", handler.CreateMembro)
			writeGroup.PUT("/membros/:id", handler.UpdateMembro)
			writeGroup.GET("/membros", handler.ListMembros)

			writeGroup.POST("/cartoes", handler.CreateCartao)
			writeGroup.GET("/cartoes", handler.ListCartoes)

			writeGroup.POST("/gastos", handler.CreateGasto)
			writeGroup.PUT("/gastos/:id", handler.UpdateGasto)
			writeGroup.GET("/gastos", handler.ListGastos)

			writeGroup.POST("/contas-fixas", handler.CreateContaFixa)
			writeGroup.GET("/contas-fixas", handler.ListContasFixas)
			writeGroup.DELETE("/contas-fixas/:id", handler.DeleteContaFixa)
		}
	}

	ts := httptest.NewServer(r)
	defer ts.Close()

	client := &http.Client{}

	// Helper: make JSON request
	makeRequest := func(method, path string, body interface{}, expectedStatus int) *http.Response {
		var bodyReader *bytes.Reader
		if body != nil {
			bodyBytes, err := json.Marshal(body)
			if err != nil {
				t.Fatalf("failed to marshal body: %v", err)
				return nil
			}
			bodyReader = bytes.NewReader(bodyBytes)
		} else {
			bodyReader = bytes.NewReader(nil)
		}

		req, err := http.NewRequest(method, ts.URL+path, bodyReader)
		if err != nil {
			t.Fatalf("failed to create request: %v", err)
			return nil
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("request failed: %v", err)
			return nil
		}

		if resp.StatusCode != expectedStatus {
			t.Fatalf("%s %s: expected status %d, got %d", method, path, expectedStatus, resp.StatusCode)
		}

		return resp
	}

	// ==========================================
	// PASSO 1: Registrar usuário
	// ==========================================
	t.Log("Passo 1: Registrando usuário...")
	resp := makeRequest("POST", "/api/auth/register", dto.RegisterRequest{
		Email:    "smoke@test.com",
		Nome:     "Smoke Test",
		Password: "senha123",
	}, http.StatusCreated)

	var authResp dto.AuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		t.Fatalf("Passo 1 falhou: %v", err)
	}
	resp.Body.Close()

	if authResp.Token == "" {
		t.Fatal("Passo 1 falhou: token vazio")
	}
	if authResp.User.Email != "smoke@test.com" {
		t.Fatalf("Passo 1 falhou: email incorreto, esperado 'smoke@test.com', recebido '%s'", authResp.User.Email)
	}
	t.Logf("  ✅ Registro OK — token: %s..., user: %s", authResp.Token[:15], authResp.User.Email)

	// ==========================================
	// PASSO 2: Login
	// ==========================================
	t.Log("Passo 2: Fazendo login...")
	resp = makeRequest("POST", "/api/auth/login", dto.LoginRequest{
		Email:    "smoke@test.com",
		Password: "senha123",
	}, http.StatusOK)

	var loginResp dto.AuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
		t.Fatalf("Passo 2 falhou: %v", err)
	}
	resp.Body.Close()

	if loginResp.Token == "" {
		t.Fatal("Passo 2 falhou: token vazio")
	}
	t.Log("  ✅ Login OK")

	// ==========================================
	// PASSO 3: Criar casa (tenant)
	// ==========================================
	t.Log("Passo 3: Criando casa...")
	resp = makeRequest("POST", "/api/tenants", dto.CreateTenantRequest{
		Name: "Casa Smoke Test",
	}, http.StatusCreated)

	var tenantResp dto.TenantResponse
	if err := json.NewDecoder(resp.Body).Decode(&tenantResp); err != nil {
		t.Fatalf("Passo 3 falhou: %v", err)
	}
	resp.Body.Close()

	if tenantResp.Name != "Casa Smoke Test" {
		t.Fatalf("Passo 3 falhou: nome incorreto, esperado 'Casa Smoke Test', recebido '%s'", tenantResp.Name)
	}
	t.Logf("  ✅ Casa criada: %s (invite: %s)", tenantResp.ID, tenantResp.InviteCode)

	// ==========================================
	// PASSO 4: Criar membros
	// ==========================================
	t.Log("Passo 4: Criando membros...")
	resp = makeRequest("POST", "/api/membros", dto.CreateMembroRequest{
		Nome:   "Luan",
		Avatar: "luan",
	}, http.StatusCreated)

	var membroResp dto.MembroResponse
	if err := json.NewDecoder(resp.Body).Decode(&membroResp); err != nil {
		t.Fatalf("Passo 4a falhou: %v", err)
	}
	resp.Body.Close()

	if membroResp.Nome != "Luan" {
		t.Fatalf("Passo 4a falhou: nome incorreto")
	}
	membro1ID := membroResp.ID

	resp = makeRequest("POST", "/api/membros", dto.CreateMembroRequest{
		Nome:   "Maria",
		Avatar: "maria",
	}, http.StatusCreated)

	var membro2Resp dto.MembroResponse
	if err := json.NewDecoder(resp.Body).Decode(&membro2Resp); err != nil {
		t.Fatalf("Passo 4b falhou: %v", err)
	}
	resp.Body.Close()
	membro2ID := membro2Resp.ID
	t.Logf("  ✅ Membros criados: %s, %s", membro1ID, membro2ID)

	// ==========================================
	// PASSO 5: Listar membros
	// ==========================================
	t.Log("Passo 5: Listando membros...")
	resp = makeRequest("GET", "/api/membros", nil, http.StatusOK)

	var membrosList []dto.MembroResponse
	if err := json.NewDecoder(resp.Body).Decode(&membrosList); err != nil {
		t.Fatalf("Passo 5 falhou: %v", err)
	}
	resp.Body.Close()

	if len(membrosList) < 2 {
		t.Fatalf("Passo 5 falhou: esperados >=2 membros, recebidos %d", len(membrosList))
	}
	t.Logf("  ✅ %d membros listados", len(membrosList))

	// ==========================================
	// PASSO 6: Atualizar membro
	// ==========================================
	t.Log("Passo 6: Atualizando membro...")
	novoNome := "Luan Silva"
	newRole := string(model.RoleAdmin)
	resp = makeRequest("PUT", "/api/membros/"+membro1ID, dto.UpdateMembroRequest{
		Nome: &novoNome,
		Role: &newRole,
	}, http.StatusOK)

	var updatedMembro dto.MembroResponse
	if err := json.NewDecoder(resp.Body).Decode(&updatedMembro); err != nil {
		t.Fatalf("Passo 6 falhou: %v", err)
	}
	resp.Body.Close()

	if updatedMembro.Nome != "Luan Silva" {
		t.Fatalf("Passo 6 falhou: nome não atualizado, esperado 'Luan Silva', recebido '%s'", updatedMembro.Nome)
	}
	t.Logf("  ✅ Membro atualizado: %s (role: %s)", updatedMembro.Nome, updatedMembro.Role)

	// ==========================================
	// PASSO 7: Criar cartão
	// ==========================================
	t.Log("Passo 7: Criando cartão...")
	resp = makeRequest("POST", "/api/cartoes", dto.CreateCartaoRequest{
		Nome:                "Nubank",
		DiaFechamento:       15,
		ResponsavelPadraoID: membro1ID,
	}, http.StatusCreated)

	var cartaoResp model.Cartao
	if err := json.NewDecoder(resp.Body).Decode(&cartaoResp); err != nil {
		t.Fatalf("Passo 7 falhou: %v", err)
	}
	resp.Body.Close()

	if cartaoResp.Nome != "Nubank" {
		t.Fatalf("Passo 7 falhou: nome incorreto")
	}
	t.Logf("  ✅ Cartão criado: %s (%s)", cartaoResp.Nome, cartaoResp.ID)

	// ==========================================
	// PASSO 8: Listar cartões
	// ==========================================
	t.Log("Passo 8: Listando cartões...")
	resp = makeRequest("GET", "/api/cartoes", nil, http.StatusOK)

	var cartoesList []model.Cartao
	if err := json.NewDecoder(resp.Body).Decode(&cartoesList); err != nil {
		t.Fatalf("Passo 8 falhou: %v", err)
	}
	resp.Body.Close()

	if len(cartoesList) < 1 {
		t.Fatalf("Passo 8 falhou: esperado >=1 cartão, recebidos %d", len(cartoesList))
	}
	t.Logf("  ✅ %d cartões listados", len(cartoesList))

	// ==========================================
	// PASSO 9: Criar gasto (avulso, sem fatura)
	// ==========================================
	t.Log("Passo 9: Criando gasto...")
	resp = makeRequest("POST", "/api/gastos", dto.CreateGastoRequest{
		Descricao:          "Supermercado",
		ValorTotalCentavos: 25000,
		CompradorID:        membro1ID,
		Method:             "pix",
		SplitMode:          "CUSTOM",
		Divisoes: []dto.SplitItem{
			{MembroID: membro1ID, ValorCentavos: 15000},
			{MembroID: membro2ID, ValorCentavos: 10000},
		},
	}, http.StatusCreated)

	var gastoResp dto.GastoResponse
	if err := json.NewDecoder(resp.Body).Decode(&gastoResp); err != nil {
		t.Fatalf("Passo 9 falhou: %v", err)
	}
	resp.Body.Close()

	if gastoResp.Descricao != "Supermercado" {
		t.Fatalf("Passo 9 falhou: descrição incorreta")
	}
	if gastoResp.ValorTotalCentavos != 25000 {
		t.Fatalf("Passo 9 falhou: valor incorreto, esperado 25000, recebido %d", gastoResp.ValorTotalCentavos)
	}
	if len(gastoResp.Divisoes) != 2 {
		t.Fatalf("Passo 9 falhou: esperadas 2 divisões, recebidas %d", len(gastoResp.Divisoes))
	}
	gastoID := gastoResp.ID
	t.Logf("  ✅ Gasto criado: %s (%s — R$ %.2f)", gastoResp.ID, gastoResp.Descricao, float64(gastoResp.ValorTotalCentavos)/100)

	// ==========================================
	// PASSO 10: Listar gastos
	// ==========================================
	t.Log("Passo 10: Listando gastos...")
	resp = makeRequest("GET", "/api/gastos", nil, http.StatusOK)

	var gastosList []dto.GastoResponse
	if err := json.NewDecoder(resp.Body).Decode(&gastosList); err != nil {
		t.Fatalf("Passo 10 falhou: %v", err)
	}
	resp.Body.Close()

	if len(gastosList) < 1 {
		t.Fatalf("Passo 10 falhou: esperado >=1 gasto, recebidos %d", len(gastosList))
	}
	t.Logf("  ✅ %d gastos listados", len(gastosList))

	// ==========================================
	// PASSO 11: Atualizar gasto
	// ==========================================
	t.Log("Passo 11: Atualizando gasto...")
	novaDescricao := "Supermercado (atualizado)"
	resp = makeRequest("PUT", "/api/gastos/"+gastoID, dto.UpdateGastoRequest{
		Descricao: &novaDescricao,
	}, http.StatusOK)

	var updatedGasto dto.GastoResponse
	if err := json.NewDecoder(resp.Body).Decode(&updatedGasto); err != nil {
		t.Fatalf("Passo 11 falhou: %v", err)
	}
	resp.Body.Close()

	if updatedGasto.Descricao != "Supermercado (atualizado)" {
		t.Fatalf("Passo 11 falhou: descricao não atualizada, esperado 'Supermercado (atualizado)', recebido '%s'", updatedGasto.Descricao)
	}
	t.Logf("  ✅ Gasto atualizado: %s", updatedGasto.Descricao)

	// ==========================================
	// PASSO 12: Criar conta fixa
	// ==========================================
	t.Log("Passo 12: Criando conta fixa...")
	resp = makeRequest("POST", "/api/contas-fixas", dto.CreateContaFixaRequest{
		Name: "Internet",
		Icon: "wifi",
	}, http.StatusCreated)

	var contaFixaResp dto.ContaFixaResponse
	if err := json.NewDecoder(resp.Body).Decode(&contaFixaResp); err != nil {
		t.Fatalf("Passo 12 falhou: %v", err)
	}
	resp.Body.Close()

	if contaFixaResp.Name != "Internet" {
		t.Fatalf("Passo 12 falhou: nome incorreto")
	}
	t.Logf("  ✅ Conta fixa criada: %s (%s)", contaFixaResp.Name, contaFixaResp.ID)

	t.Log("=========================================")
	t.Log("🎉 SMOKE TEST COMPLETO — 11 passos OK!")
	t.Log("=========================================")
}
