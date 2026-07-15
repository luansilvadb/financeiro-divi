package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func TestJWTAuth_MissingHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.GET("/protected", JWTAuth("secret"))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}

	var body map[string]string
	_ = json.Unmarshal(w.Body.Bytes(), &body)
	if body["message"] != "token não fornecido" {
		t.Fatalf("expected 'token não fornecido', got '%s'", body["message"])
	}
}

func TestJWTAuth_InvalidFormat(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.GET("/protected", JWTAuth("secret"))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "InvalidToken")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestJWTAuth_InvalidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.GET("/protected", JWTAuth("secret"))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer invalidtoken")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestJWTAuth_ValidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	claims := jwt.MapClaims{
		"sub":   "user-123",
		"email": "user@test.com",
		"iat":   time.Now().Unix(),
		"exp":   time.Now().Add(1 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte("my-secret"))

	r := gin.New()
	r.GET("/protected", JWTAuth("my-secret"), func(c *gin.Context) {
		userID := c.GetString("userID")
		userEmail := c.GetString("userEmail")

		if userID != "user-123" {
			t.Fatalf("expected userID 'user-123', got '%s'", userID)
		}
		if userEmail != "user@test.com" {
			t.Fatalf("expected userEmail 'user@test.com', got '%s'", userEmail)
		}

		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestJWTAuth_WrongSecret(t *testing.T) {
	gin.SetMode(gin.TestMode)

	claims := jwt.MapClaims{
		"sub":   "user-123",
		"email": "user@test.com",
		"exp":   time.Now().Add(1 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte("different-secret"))

	r := gin.New()
	r.GET("/protected", JWTAuth("my-secret"))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for wrong secret, got %d", w.Code)
	}
}

func TestValidateToken_Valid(t *testing.T) {
	claims := jwt.MapClaims{
		"sub":   "user-123",
		"email": "user@test.com",
		"exp":   time.Now().Add(1 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte("my-secret"))

	userID, err := ValidateToken("my-secret", tokenStr)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if userID != "user-123" {
		t.Fatalf("expected 'user-123', got '%s'", userID)
	}
}

func TestValidateToken_InvalidSecret(t *testing.T) {
	claims := jwt.MapClaims{
		"sub":   "user-123",
		"email": "user@test.com",
		"exp":   time.Now().Add(1 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte("correct-secret"))

	_, err := ValidateToken("wrong-secret", tokenStr)
	if err == nil {
		t.Fatal("expected error for wrong secret")
	}
}

func TestValidateToken_Expired(t *testing.T) {
	claims := jwt.MapClaims{
		"sub":   "user-123",
		"email": "user@test.com",
		"exp":   time.Now().Add(-1 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte("my-secret"))

	_, err := ValidateToken("my-secret", tokenStr)
	if err == nil {
		t.Fatal("expected error for expired token")
	}
}

func TestValidateToken_InvalidString(t *testing.T) {
	_, err := ValidateToken("my-secret", "not-a-jwt-token")
	if err == nil {
		t.Fatal("expected error for invalid token string")
	}
}

func TestJWTAuth_ExpiredToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	claims := jwt.MapClaims{
		"sub":   "user-123",
		"email": "user@test.com",
		"iat":   time.Now().Add(-2 * time.Hour).Unix(),
		"exp":   time.Now().Add(-1 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte("my-secret"))

	r := gin.New()
	r.GET("/protected", JWTAuth("my-secret"))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for expired token, got %d", w.Code)
	}
}
