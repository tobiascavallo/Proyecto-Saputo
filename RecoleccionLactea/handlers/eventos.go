package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
)

// eventos.go - Endpoint de streaming SSE.
//
// IMPORTANTE: esta es una versión mínima, solo para validar de punta a punta
// que el ticket + AuthMiddlewareSSE funcionan y que la conexión se mantiene
// abierta. Todavía NO hace broadcast de eventos de negocio (remito
// sincronizado, resultado cargado, etc.) — eso se agrega en el próximo paso,
// cuando conectemos esto con el hub de conexiones.

type EventosHandler struct{}

func NewEventosHandler() EventosHandler {
	return EventosHandler{}
}

func (h EventosHandler) Stream(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	c.SSEvent("conectado", gin.H{"mensaje": "conexion establecida"})
	c.Writer.Flush()

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-c.Request.Context().Done():
			// El cliente cerró la conexión (cerró la pestaña, se desconectó, etc.)
			return
		case <-ticker.C:
			c.SSEvent("heartbeat", gin.H{"hora": time.Now().Format(time.RFC3339)})
			c.Writer.Flush()
		}
	}
}
