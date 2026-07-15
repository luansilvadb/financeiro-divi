package validator

import (
	"testing"

	"github.com/go-playground/validator/v10"
	"github.com/luansilvadb/financeiro-divi/backend-go/internal/model"
)

type roleTest struct {
	Role string `validate:"role"`
}

type splitModeTest struct {
	Mode string `validate:"split_mode"`
}

func newTestValidator() *validator.Validate {
	v := validator.New()
	_ = v.RegisterValidation("role", func(fl validator.FieldLevel) bool {
		role := model.Role(fl.Field().String())
		switch role {
		case model.RoleAdmin, model.RoleMorador, model.RoleVisualizador:
			return true
		}
		return false
	})
	_ = v.RegisterValidation("split_mode", func(fl validator.FieldLevel) bool {
		mode := model.SplitMode(fl.Field().String())
		switch mode {
		case model.SplitModeEqual, model.SplitModeIncome, model.SplitModeCustom:
			return true
		}
		return false
	})
	return v
}

func TestValidRoles(t *testing.T) {
	v := newTestValidator()
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{"admin role", "ADMIN", true},
		{"morador role", "MORADOR", true},
		{"visualizador role", "VISUALIZADOR", true},
		{"invalid role lower", "admin", false},
		{"empty role", "", false},
		{"unknown role", "SUPER_ADMIN", false},
		{"role with spaces", " ADMIN ", false},
		{"numeric role", "123", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.Struct(roleTest{Role: tt.input})
			got := err == nil
			if got != tt.want {
				t.Errorf("ValidateRole(%q): got valid=%v, want valid=%v", tt.input, got, tt.want)
			}
		})
	}
}

func TestValidSplitModes(t *testing.T) {
	v := newTestValidator()
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{"equal mode", "EQUAL", true},
		{"income mode", "INCOME", true},
		{"custom mode", "CUSTOM", true},
		{"invalid mode lower", "equal", false},
		{"empty mode", "", false},
		{"unknown mode", "PERCENTAGE", false},
		{"mode with spaces", " EQUAL ", false},
		{"numeric mode", "0", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.Struct(splitModeTest{Mode: tt.input})
			got := err == nil
			if got != tt.want {
				t.Errorf("ValidateSplitMode(%q): got valid=%v, want valid=%v", tt.input, got, tt.want)
			}
		})
	}
}
