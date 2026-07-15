package model

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func TestRoleConstants(t *testing.T) {
	tests := []struct {
		role Role
		want string
	}{
		{RoleAdmin, "ADMIN"},
		{RoleMorador, "MORADOR"},
		{RoleVisualizador, "VISUALIZADOR"},
	}
	for _, tt := range tests {
		if string(tt.role) != tt.want {
			t.Errorf("expected %q, got %q", tt.want, string(tt.role))
		}
	}
}

func TestSplitModeConstants(t *testing.T) {
	tests := []struct {
		mode SplitMode
		want string
	}{
		{SplitModeEqual, "EQUAL"},
		{SplitModeIncome, "INCOME"},
		{SplitModeCustom, "CUSTOM"},
	}
	for _, tt := range tests {
		if string(tt.mode) != tt.want {
			t.Errorf("expected %q, got %q", tt.want, string(tt.mode))
		}
	}
}

func TestValidationEventTypeConstants(t *testing.T) {
	tests := []struct {
		et   ValidationEventType
		want string
	}{
		{EventTenantCreated, "TENANT_CREATED"},
		{EventSecondLinkedMemberJoined, "SECOND_LINKED_MEMBER_JOINED"},
		{EventFirstExpenseCreated, "FIRST_EXPENSE_CREATED"},
		{EventPeriodClosed, "PERIOD_CLOSED"},
		{EventFirstSettlementRecorded, "FIRST_SETTLEMENT_RECORDED"},
	}
	for _, tt := range tests {
		if string(tt.et) != tt.want {
			t.Errorf("expected %q, got %q", tt.want, string(tt.et))
		}
	}
}

func TestTenantTableName(t *testing.T) {
	var t2 Tenant
	if t2.TableName() != "tenants" {
		t.Errorf("got %q", Tenant{}.TableName())
	}
}

func TestTenantBeforeCreate(t *testing.T) {
	t.Run("generates uuid when empty", func(t *testing.T) {
		tenant := Tenant{}
		if err := tenant.BeforeCreate(&gorm.DB{}); err != nil {
			t.Fatal(err)
		}
		if _, err := uuid.Parse(tenant.ID); err != nil {
			t.Errorf("expected valid UUID, got %q: %v", tenant.ID, err)
		}
	})

	t.Run("keeps existing id", func(t *testing.T) {
		tenant := Tenant{ID: "custom-id"}
		if err := tenant.BeforeCreate(&gorm.DB{}); err != nil {
			t.Fatal(err)
		}
		if tenant.ID != "custom-id" {
			t.Errorf("expected ID to remain 'custom-id', got %q", tenant.ID)
		}
	})
}

func TestUsuarioTableName(t *testing.T) {
	var u2 Usuario
	if u2.TableName() != "usuarios" {
		t.Errorf("got %q", Usuario{}.TableName())
	}
}

func TestUsuarioBeforeCreate(t *testing.T) {
	t.Run("generates uuid when empty", func(t *testing.T) {
		u := Usuario{}
		if err := u.BeforeCreate(&gorm.DB{}); err != nil {
			t.Fatal(err)
		}
		if _, err := uuid.Parse(u.ID); err != nil {
			t.Errorf("expected valid UUID, got %q: %v", u.ID, err)
		}
	})

	t.Run("keeps existing id", func(t *testing.T) {
		u := Usuario{ID: "my-id"}
		if err := u.BeforeCreate(&gorm.DB{}); err != nil {
			t.Fatal(err)
		}
		if u.ID != "my-id" {
			t.Errorf("expected ID to remain 'my-id', got %q", u.ID)
		}
	})
}

func TestMembroCasaTableName(t *testing.T) {
	var m2 MembroCasa
	if m2.TableName() != "membros_casa" {
		t.Errorf("got %q", MembroCasa{}.TableName())
	}
}

func TestCartaoTableName(t *testing.T) {
	var c2 Cartao
	if c2.TableName() != "cartoes" {
		t.Errorf("got %q", Cartao{}.TableName())
	}
}

func TestFaturaTableName(t *testing.T) {
	var f2 Fatura
	if f2.TableName() != "faturas" {
		t.Errorf("got %q", Fatura{}.TableName())
	}
}

func TestGastoTableName(t *testing.T) {
	var g2 Gasto
	if g2.TableName() != "gastos" {
		t.Errorf("got %q", Gasto{}.TableName())
	}
}

func TestDivisaoGastoTableName(t *testing.T) {
	var dg DivisaoGasto
	if dg.TableName() != "divisoes_gasto" {
		t.Errorf("got %q", DivisaoGasto{}.TableName())
	}
}

func TestContaFixaTableName(t *testing.T) {
	var cf ContaFixa
	if cf.TableName() != "contas_fixas" {
		t.Errorf("got %q", ContaFixa{}.TableName())
	}
}

func TestAuditLogTableName(t *testing.T) {
	var al AuditLog
	if al.TableName() != "audit_logs" {
		t.Errorf("got %q", AuditLog{}.TableName())
	}
}

func TestProductValidationEventTableName(t *testing.T) {
	var pve ProductValidationEvent
	if pve.TableName() != "product_validation_events" {
		t.Errorf("got %q", ProductValidationEvent{}.TableName())
	}
}

func TestPasswordResetTokenTableName(t *testing.T) {
	var prt PasswordResetToken
	if prt.TableName() != "password_reset_tokens" {
		t.Errorf("got %q", PasswordResetToken{}.TableName())
	}
}

func TestAllTableNamesUnique(t *testing.T) {
	var (
		tenant  Tenant
		usuario Usuario
		membro  MembroCasa
		cartao  Cartao
		fatura  Fatura
		gasto   Gasto
		dg      DivisaoGasto
		cf      ContaFixa
		al      AuditLog
		pve     ProductValidationEvent
		prt     PasswordResetToken
	)
	names := map[string]int{
		tenant.TableName():  1,
		usuario.TableName(): 1,
		membro.TableName():  1,
		cartao.TableName():  1,
		fatura.TableName():  1,
		gasto.TableName():   1,
		dg.TableName():      1,
		cf.TableName():      1,
		al.TableName():      1,
		pve.TableName():     1,
		prt.TableName():     1,
	}
	for name := range names {
		if name == "" {
			t.Error("found empty table name")
		}
	}
}

func TestGastoDivisoesDefaultNil(t *testing.T) {
	var g Gasto
	if g.Divisoes != nil {
		t.Error("expected Divisoes to be nil by default")
	}
	if g.ID != "" || g.TenantID != "" {
		t.Error("expected empty strings by default")
	}
}

func TestMembroCasaDefaults(t *testing.T) {
	m := MembroCasa{}
	if m.Ativo != false {
		t.Errorf("expected Ativo default false, got %v", m.Ativo)
	}
	if m.Role != "" {
		t.Errorf("expected Role default empty, got %q", m.Role)
	}
}

func TestFaturaFields(t *testing.T) {
	f := Fatura{
		ID: "f-1", TenantID: "t-1", CartaoID: "c-1",
		Mes: 12, Ano: 2024, ResponsavelID: "m-1", Status: "ABERTA",
	}
	if f.ID != "f-1" || f.TenantID != "t-1" || f.CartaoID != "c-1" {
		t.Errorf("unexpected identity fields: %+v", f)
	}
	if f.Mes < 1 || f.Mes > 12 {
		t.Errorf("invalid month: %d", f.Mes)
	}
	if f.Ano < 2020 {
		t.Errorf("unexpected year: %d", f.Ano)
	}
	if f.Status != "ABERTA" {
		t.Errorf("expected status ABERTA, got %s", f.Status)
	}
}

func TestGastoSplitModeDefault(t *testing.T) {
	g := Gasto{}
	if g.SplitMode != "" {
		t.Errorf("expected empty SplitMode default, got %q", g.SplitMode)
	}
	if g.Installments != 0 {
		t.Errorf("expected Installments default 0, got %d", g.Installments)
	}
	if g.IsPrivate != false {
		t.Errorf("expected IsPrivate default false, got %v", g.IsPrivate)
	}
}

func TestProductValidationEventFields(t *testing.T) {
	e := ProductValidationEvent{
		TenantID:  "t-1",
		Type:      EventTenantCreated,
		DedupeKey: "tenant-1",
	}
	if e.TenantID != "t-1" || e.DedupeKey != "tenant-1" {
		t.Errorf("unexpected fields: %+v", e)
	}
	if e.Type != EventTenantCreated {
		t.Errorf("got type %q, want %q", e.Type, EventTenantCreated)
	}
}

func TestPasswordResetTokenExpiry(t *testing.T) {
	now := time.Now()
	token := PasswordResetToken{
		Token:     "reset-token",
		UserID:    "u-1",
		ExpiresAt: now.Add(24 * time.Hour),
	}
	if token.Token != "reset-token" || token.UserID != "u-1" {
		t.Errorf("unexpected identity fields: %+v", token)
	}
	if !token.ExpiresAt.After(now) {
		t.Error("expected token to expire in the future")
	}
	token.ExpiresAt = now.Add(-1 * time.Hour)
	if token.ExpiresAt.Before(now) {
		t.Log("expired token correctly detected")
	}
}

func TestAuditLogCreation(t *testing.T) {
	log := AuditLog{
		TenantID: "t-1",
		MembroID: "m-1",
		Acao:     "CRIAR_GASTO",
		Detalhes: `{"gasto_id": "g-1", "valor": 5000}`,
	}
	if log.TenantID != "t-1" || log.MembroID != "m-1" {
		t.Errorf("unexpected identity fields: %+v", log)
	}
	if log.Acao != "CRIAR_GASTO" {
		t.Errorf("got acao %q", log.Acao)
	}
	if log.Detalhes == "" {
		t.Error("expected non-empty detalhes")
	}
}

func TestContaFixaDefaultSplit(t *testing.T) {
	c := ContaFixa{Name: "Internet", Icon: "wifi"}
	if c.Name != "Internet" || c.Icon != "wifi" {
		t.Errorf("unexpected identity fields: %+v", c)
	}
	if c.DefaultSplit != "" {
		t.Errorf("expected empty DefaultSplit, got %q", c.DefaultSplit)
	}
	if c.FixedValueCentavos != nil {
		t.Errorf("expected nil FixedValueCentavos, got %v", *c.FixedValueCentavos)
	}
}

func TestCartaoDiaFechamentoBounds(t *testing.T) {
	c := Cartao{DiaFechamento: 31}
	if c.DiaFechamento < 1 || c.DiaFechamento > 31 {
		t.Errorf("dia_fechamento out of bounds: %d", c.DiaFechamento)
	}
}
