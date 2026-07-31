package middleware

import (
	"github.com/gin-gonic/gin"
)

// auth_sse.go - Middleware de autenticación exclusivo para el endpoint SSE.
//
// El navegador (EventSource) no permite mandar headers custom, por lo que
// no puede usarse AuthMiddleware (que lee el header Authorization) para esta
// ruta puntual. En su lugar, el cliente manda un ticket de un solo uso
// (obtenido previamente en /api/v1/eventos/ticket con el JWT normal) como
// query param. El ticket se consume en el momento de validarse: si alguien
// lo intercepta después, ya no sirve.
//
// Esto NO reemplaza a AuthMiddleware en ningún otro lado del sistema — es
// exclusivo de la ruta de streaming.

type ValidadorTicketSSE interface {
	ValidarYConsumirTicket(ticket string) (usuarioID string, rol string, err error)
}

func AuthMiddlewareSSE(ticketService ValidadorTicketSSE) gin.HandlerFunc {
	return func(c *gin.Context) {
		ticket := c.Query("ticket")
		if ticket == "" {
			c.JSON(401, gin.H{"error": "ticket requerido"})
			c.Abort()
			return
		}

		usuarioID, rol, err := ticketService.ValidarYConsumirTicket(ticket)
		if err != nil {
			c.JSON(401, gin.H{"error": err.Error()})
			c.Abort()
			return
		}

		c.Set("usuario_id", usuarioID)
		c.Set("rol", rol)
		c.Next()
	}
}
