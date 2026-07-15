package middleware

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders adds common HTTP security headers to responses.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		// HSTS: only set over HTTPS. Adjust max-age as needed.
		if c.Request.TLS != nil {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		c.Header("Server", "")
		// Content-Security-Policy for the API (frontend is served separately by Vite).
		// Restrictive defaults: no external resources, no frames, no form actions.
		c.Header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; form-action 'none'")
		// Prevent MIME type sniffing from affecting caching behavior
		c.Header("Cache-Control", "no-store, max-age=0")
		c.Next()
	}
}

// Timeout adds a deadline to the request context.
func Timeout(d time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), d)
		defer cancel()
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
