package handlers

import (
	"github.com/gin-gonic/gin"
)

// ticket_sse.go - Endpoint para pedir un ticket de un solo uso antes de
// abrir la conexión SSE. Se accede con el JWT normal (header Authorization,
// vía AuthMiddleware estándar) — el ticket resultante es lo único que después
// viaja como query param.

type TicketSSEService interface {
	GenerarTicket(usuarioID string, rol string) (string, error)
}

type TicketSSEHandler struct {
	service TicketSSEService
}

func NewTicketSSEHandler(service TicketSSEService) TicketSSEHandler {
	return TicketSSEHandler{service: service}
}

func (h TicketSSEHandler) GenerarTicket(c *gin.Context) {
	usuarioID, _ := c.Get("usuario_id")
	rol, _ := c.Get("rol")

	ticket, err := h.service.GenerarTicket(usuarioID.(string), rol.(string))
	if err != nil {
		c.JSON(500, gin.H{"error": "error al generar ticket"})
		return
	}

	c.JSON(200, gin.H{"ticket": ticket})
}
