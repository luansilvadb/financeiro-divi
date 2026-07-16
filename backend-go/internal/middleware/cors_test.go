package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func setupCORSTest() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(CORSMiddleware([]string{"http://example.com"}))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	r.OPTIONS("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	return r
}

func TestCORSMiddleware_ActualRequest(t *testing.T) {
	r := setupCORSTest()

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "http://example.com")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestCORSMiddleware_OptionsRequest(t *testing.T) {
	r := setupCORSTest()

	req := httptest.NewRequest(http.MethodOptions, "/test", nil)
	req.Header.Set("Origin", "http://example.com")
	req.Header.Set("Access-Control-Request-Method", "POST")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestCORSMiddleware_NoOriginStillSucceeds(t *testing.T) {
	r := setupCORSTest()

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestCORSMiddleware_WildcardOrigins(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(CORSMiddleware([]string{"*"}))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "http://any-origin.com")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	resp := w.Result()
	allowOrigin := resp.Header.Get("Access-Control-Allow-Origin")
	allowCredentials := resp.Header.Get("Access-Control-Allow-Credentials")
	if allowOrigin != "*" {
		t.Fatalf("expected '*', got '%s'", allowOrigin)
	}
	if allowCredentials != "" {
		t.Fatalf("expected empty credentials with wildcard, got '%s'", allowCredentials)
	}
}

func TestCORSMiddleware_SpecificOrigins(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(CORSMiddleware([]string{"http://app.example.com"}))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "http://app.example.com")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	resp := w.Result()
	allowCredentials := resp.Header.Get("Access-Control-Allow-Credentials")
	if allowCredentials != "true" {
		t.Fatalf("expected 'true' for specific origins, got '%s'", allowCredentials)
	}
}
