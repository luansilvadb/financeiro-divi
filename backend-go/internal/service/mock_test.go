package service

import (
	"context"

	"github.com/luansilvadb/financeiro-divi/backend-go/internal/model"
	"github.com/luansilvadb/financeiro-divi/backend-go/internal/repository"
)

type mockFaturaRepo struct {
	repository.FaturaRepository
	faturas map[string]*model.Fatura
}

func (m *mockFaturaRepo) Create(ctx context.Context, f *model.Fatura) error {
	if m.faturas == nil {
		m.faturas = make(map[string]*model.Fatura)
	}
	m.faturas[f.ID] = f
	return nil
}
