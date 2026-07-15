package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/luansilvadb/financeiro-divi/backend-go/internal/model"
)

func TestRoleRequired_MissingRole(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.GET("/admin", RoleRequired(model.RoleAdmin))

	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", w.Code)
	}

	var body map[string]string
	_ = json.Unmarshal(w.Body.Bytes(), &body)
	if body["message"] != "acesso negado" {
		t.Fatalf("expected 'acesso negado', got '%s'", body["message"])
	}
}

func TestRoleRequired_InsufficientRole(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.GET("/admin", func(c *gin.Context) {
		c.Set("userRole", string(model.RoleMorador))
		c.Next()
	}, RoleRequired(model.RoleAdmin))

	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", w.Code)
	}
}

func TestRoleRequired_ValidRole(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.GET("/admin", func(c *gin.Context) {
		c.Set("userRole", string(model.RoleAdmin))
		c.Next()
	}, RoleRequired(model.RoleAdmin), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestRoleRequired_MultipleRoles(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.GET("/area", func(c *gin.Context) {
		c.Set("userRole", string(model.RoleVisualizador))
		c.Next()
	}, RoleRequired(model.RoleAdmin, model.RoleVisualizador), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/area", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}
