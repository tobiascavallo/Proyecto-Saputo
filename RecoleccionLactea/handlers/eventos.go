package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/services"
)

// eventos.go - Endpoint de streaming SSE.
//
// La autenticación ya quedó resuelta antes de llegar acá (ver
// middleware/auth_sse.go + el ticket de un solo uso). Este handler se ocupa
// de otra cosa: registrarse en el hub para recibir los eventos de negocio
// (remito sincronizado/finalizado, resultado cargado/actualizado, solicitud
// resuelta) y reenviárselos al cliente mientras la conexión esté abierta.

type HubSSE interface {
	Registrar(idConexion string) chan services.EventoSSE
	Desregistrar(idConexion string)
}

type EventosHandler struct {
	hub HubSSE
}

func NewEventosHandler(hub HubSSE) EventosHandler {
	return EventosHandler{hub: hub}
}

func (h EventosHandler) Stream(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	idConexion, err := generarIDConexion()
	if err != nil {
		c.JSON(500, gin.H{"error": "error al inicializar la conexión"})
		return
	}

	canal := h.hub.Registrar(idConexion)
	defer h.hub.Desregistrar(idConexion)

	c.SSEvent("conectado", gin.H{"mensaje": "conexion establecida"})
	c.Writer.Flush()

	// El heartbeat sigue existiendo además de los eventos de negocio: sirve
	// para que el cliente (y proxies intermedios) detecten que la conexión
	// sigue viva aunque no haya novedades de negocio por un rato.
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-c.Request.Context().Done():
			// El cliente cerró la conexión (cerró la pestaña, se desconectó, etc.)
			return
		case evento, abierto := <-canal:
			if !abierto {
				return
			}
			c.SSEvent(evento.Tipo, evento.Datos)
			c.Writer.Flush()
		case <-ticker.C:
			c.SSEvent("heartbeat", gin.H{"hora": time.Now().Format(time.RFC3339)})
			c.Writer.Flush()
		}
	}
}

// generarIDConexion crea un identificador único por conexión SSE, para poder
// registrarla y desregistrarla del hub. No tiene nada que ver con el ticket
// de autenticación — es solo la clave interna del mapa de clientes del hub.
func generarIDConexion() (string, error) {
	bytesAleatorios := make([]byte, 16)
	if _, err := rand.Read(bytesAleatorios); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytesAleatorios), nil
}
