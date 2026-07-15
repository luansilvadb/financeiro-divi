package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/luansilvadb/financeiro-divi/backend-go/internal/model"
)

func RoleRequired(roles ...model.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("userRole")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "acesso negado"})
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "acesso negado"})
			return
		}

		role := model.Role(roleStr)
		for _, r := range roles {
			if role == r {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "nível de permissão insuficiente"})
	}
}
