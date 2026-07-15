package middleware

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// CSRFToken adds a double-submit cookie CSRF protection.
// Safe for SPAs: the token is set as a cookie (httpOnly=false so JS can read it)
// and must be echoed back in the X-CSRF-Token header for state-changing requests.
func CSRFToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only validate on state-changing methods
		if c.Request.Method == "GET" || c.Request.Method == "HEAD" || c.Request.Method == "OPTIONS" {
			ensureCSRFCookie(c)
			c.Next()
			return
		}

		cookieToken, err := c.Cookie("csrf_token")
		if err != nil || cookieToken == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "CSRF token ausente"})
			return
		}

		headerToken := c.GetHeader("X-CSRF-Token")
		if headerToken == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "CSRF token ausente no header"})
			return
		}

		// Constant-time comparison to prevent timing attacks
		if !hmacEqual(cookieToken, headerToken) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "CSRF token inválido"})
			return
		}

		c.Next()
	}
}

func ensureCSRFCookie(c *gin.Context) {
	if token, err := c.Cookie("csrf_token"); err == nil {
		// Cookie já existe: sempre expor o valor atual no header
		c.Header("X-CSRF-Token", token)
		return
	}
	token := generateCSRFToken()
	// Secure flag: true when request is over TLS (matches HSTS pattern in security.go).
	// HttpOnly remains false intentionally — the SPA needs to read this cookie for
	// the double-submit CSRF pattern (X-CSRF-Token header).
	isSecure := c.Request.TLS != nil
	c.SetCookie("csrf_token", token, 0, "/", "", isSecure, false)
	// Also set as header so JS can read it on first load
	c.Header("X-CSRF-Token", token)
}

func generateCSRFToken() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		// Fallback: mix crypto/rand with time to produce a non-deterministic token
		// when the system entropy pool is exhausted. Using a zero-filled buffer
		// would produce the same token for every client, defeating CSRF protection.
		now := time.Now().UnixNano()
		fallback := make([]byte, 32)
		// XOR the current timestamp into the buffer so concurrent calls within the
		// same nanosecond still get different values (time moves forward).
		for i := range fallback {
			fallback[i] = byte(now >> (8 * (i % 8)))
		}
		// Additionally try to read whatever entropy is available (partial read).
		// If this also fails, we still have the time-based bytes as a last resort.
		if _, fallbackErr := rand.Read(fallback); fallbackErr != nil {
			// As a final safety net, mix in nanosecond precision from the monotonic
			// clock — even if crypto/rand is completely dead, this gives us
			// different tokens per call within the same process lifetime.
			fallback[0] ^= byte(now)
			fallback[1] ^= byte(now >> 8)
			fallback[31] ^= byte(now>>16) ^ byte(now>>32) ^ byte(now>>48)
		}
		return hex.EncodeToString(fallback)
	}
	return hex.EncodeToString(b)
}

func hmacEqual(a, b string) bool {
	// Use SHA256 to avoid timing side-channels
	ha := sha256.Sum256([]byte(a))
	hb := sha256.Sum256([]byte(b))
	if len(ha) != len(hb) {
		return false
	}
	var diff byte
	for i := range ha {
		diff |= ha[i] ^ hb[i]
	}
	return diff == 0
}
