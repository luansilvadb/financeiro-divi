package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// userFacingError returns an error message suitable for display to end users.
// In release mode, internal error details are hidden behind a generic message
// to avoid leaking implementation details (column names, file paths, etc.).
// In debug/test mode, the original error message is preserved for development.
func userFacingError(err error) string {
	if gin.Mode() == gin.ReleaseMode {
		return "Ocorreu um erro interno. Tente novamente mais tarde."
	}
	return err.Error()
}

// respondInternalError sends a 500 JSON response with a sanitized error message.
// Use this for all internal server errors in handlers.
func respondInternalError(c *gin.Context, err error) {
	c.JSON(http.StatusInternalServerError, gin.H{"message": userFacingError(err)})
}
