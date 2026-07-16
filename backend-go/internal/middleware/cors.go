package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORSMiddleware(allowedOrigins []string) gin.HandlerFunc {
	cfg := cors.Config{
		AllowMethods:     []string{"GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Accept", "Authorization", "X-Tenant-ID", "X-CSRF-Token", "Origin", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "X-CSRF-Token"},
		AllowCredentials: true,
	}

	if len(allowedOrigins) == 1 && allowedOrigins[0] == "*" {
		cfg.AllowAllOrigins = true
		// CORS spec forbids credentials with wildcard origin; disable them.
		cfg.AllowCredentials = false
	} else {
		cfg.AllowOrigins = allowedOrigins
	}

	return cors.New(cfg)
}
