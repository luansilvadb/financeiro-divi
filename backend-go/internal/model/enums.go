package model

type Role string

const (
	RoleAdmin        Role = "ADMIN"
	RoleMorador      Role = "MORADOR"
	RoleVisualizador Role = "VISUALIZADOR"
)

type PaymentMethod string

const (
	PaymentMethodPix  PaymentMethod = "pix"
	PaymentMethodCard PaymentMethod = "card"
	PaymentMethodCash PaymentMethod = "cash"
)

type SplitMode string

const (
	SplitModeEqual  SplitMode = "EQUAL"
	SplitModeIncome SplitMode = "INCOME"
	SplitModeCustom SplitMode = "CUSTOM"
)

type ValidationEventType string

const (
	EventTenantCreated            ValidationEventType = "TENANT_CREATED"
	EventSecondLinkedMemberJoined ValidationEventType = "SECOND_LINKED_MEMBER_JOINED"
	EventFirstExpenseCreated      ValidationEventType = "FIRST_EXPENSE_CREATED"
	EventPeriodClosed             ValidationEventType = "PERIOD_CLOSED"
	EventFirstSettlementRecorded  ValidationEventType = "FIRST_SETTLEMENT_RECORDED"
)
