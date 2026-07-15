package validator

import (
	"testing"
)

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"senha valida", "Senha1234", false},
		{"minimo 8 com tudo", "Abcdefg1", false},
		{"exatamente 8 validos", "Teste123", false},
		{"curta demais", "Abc1", true},
		{"sem maiuscula", "senha1234", true},
		{"sem numero", "Senhaaaaa", true},
		{"apenas numeros", "12345678", true},
		{"apenas minusculas", "abcdefgh", true},
		{"vazia", "", true},
		{"7 caracteres validos", "Teste12", true},
		{"unicode valido", "Coração1", false},
		{"senha longa valida", "MinhaSenhaSuperForte12345", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePassword(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePassword(%q) error = %v, wantErr = %v", tt.password, err, tt.wantErr)
			}
		})
	}
}
