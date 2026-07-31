package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
	"time"
)

// ticket_sse.go - Servicio de tickets de un solo uso para autenticar la
// conexión SSE de tiempo real.
//
// Por qué existe: el navegador (EventSource) no permite mandar headers
// custom, así que no se puede usar el header Authorization como en el resto
// de las rutas. Mandar el JWT normal como query param sería un riesgo real
// (queda en logs, historial del navegador, header Referer), y ese JWT sirve
// para todo el sistema, no solo para este endpoint.
//
// La solución: el cliente pide un ticket aleatorio de vida muy corta usando
// su JWT normal (header Authorization, como siempre). Ese ticket solo sirve
// para abrir la conexión SSE, se consume en el momento en que se usa, y
// expira en segundos si no se usa. Si un ticket queda expuesto en un log,
// ya no sirve para nada.
//
// Vive en memoria (no en Mongo) porque es un secreto de vida ultra corta,
// no un dato de negocio — no necesita persistencia ni sobrevivir un restart.

const ttlTicketSSE = 20 * time.Second

type TicketSSE struct {
	UsuarioID string
	Rol       string
	Expira    time.Time
}

type TicketSSEService struct {
	mu      sync.Mutex
	tickets map[string]TicketSSE
}

func NewTicketSSEService() *TicketSSEService {
	return &TicketSSEService{
		tickets: make(map[string]TicketSSE),
	}
}

// GenerarTicket crea un ticket aleatorio (mismo mecanismo que
// utils.GenerarRefreshToken: 32 bytes random en hex) asociado al usuario y
// rol que vienen del JWT ya validado por el AuthMiddleware normal.
func (s *TicketSSEService) GenerarTicket(usuarioID string, rol string) (string, error) {
	bytesAleatorios := make([]byte, 32)
	if _, err := rand.Read(bytesAleatorios); err != nil {
		return "", err
	}
	ticket := hex.EncodeToString(bytesAleatorios)

	s.mu.Lock()
	defer s.mu.Unlock()

	s.limpiarVencidos()

	s.tickets[ticket] = TicketSSE{
		UsuarioID: usuarioID,
		Rol:       rol,
		Expira:    time.Now().Add(ttlTicketSSE),
	}

	return ticket, nil
}

// ValidarYConsumirTicket busca el ticket, lo borra inmediatamente (de un solo
// uso, sin importar si es válido o no) y devuelve el usuario/rol asociado si
// todavía estaba vigente.
func (s *TicketSSEService) ValidarYConsumirTicket(ticket string) (usuarioID string, rol string, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	datos, existe := s.tickets[ticket]
	delete(s.tickets, ticket)

	if !existe {
		return "", "", errors.New("ticket invalido o ya utilizado")
	}

	if time.Now().After(datos.Expira) {
		return "", "", errors.New("ticket expirado")
	}

	return datos.UsuarioID, datos.Rol, nil
}

// limpiarVencidos elimina tickets vencidos que nunca se llegaron a usar.
// Se llama de forma lazy cada vez que se genera un ticket nuevo, para que el
// mapa no crezca indefinidamente sin necesidad de una goroutine dedicada.
func (s *TicketSSEService) limpiarVencidos() {
	ahora := time.Now()
	for ticket, datos := range s.tickets {
		if ahora.After(datos.Expira) {
			delete(s.tickets, ticket)
		}
	}
}
