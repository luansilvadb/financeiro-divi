package service

import "github.com/luansilvadb/financeiro-divi/backend-go/internal/dto"

type WSHub interface {
	Broadcast(tenantID string, msg dto.WSMessage)
}
