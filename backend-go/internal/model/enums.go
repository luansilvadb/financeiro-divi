package model

type Role string

const (
	RoleAdmin        Role = "ADMIN"
	RoleMorador      Role = "MORADOR"
	RoleVisualizador Role = "VISUALIZADOR"
)

type SplitMode string

const (
	SplitModeEqual  SplitMode = "EQUAL"
	SplitModeIncome SplitMode = "INCOME"
	SplitModeCustom SplitMode = "CUSTOM"
)

type ValidationEventType string
