package services

import "sync"

// hub_sse.go - Hub de conexiones para el tiempo real (SSE).
//
// Complementa al ticket de un solo uso (ver ticket_sse.go): el ticket ya
// resolvió "quién puede conectarse" antes de llegar acá. El hub resuelve
// "qué le llega" a cada conexión ya autenticada mientras está abierta.
//
// No hay filtrado por rol ni por usuario: todos los eventos van a todos los
// clientes conectados (Empleado y Encargado ven las mismas cargas en tiempo
// real, según Regla 3 de la especificación).
//
// Vive en memoria, como el hub es un solo proceso (no hay múltiples
// instancias del backend corriendo en paralelo todavía) — no hace falta un
// broker externo tipo Redis pub/sub para esta escala.

type EventoSSE struct {
	Tipo  string      `json:"tipo"`
	Datos interface{} `json:"datos"`
}

// tamañoBufferCliente define cuántos eventos puede acumular un cliente antes
// de que el hub empiece a descartarle eventos nuevos. Un buffer chico alcanza:
// el cliente los va consumiendo casi al instante, y si se atrasa mucho ya es
// una señal de que la conexión está en problemas.
const tamañoBufferCliente = 10

type HubSSE struct {
	mu       sync.Mutex
	clientes map[string]chan EventoSSE
}

func NewHubSSE() *HubSSE {
	return &HubSSE{
		clientes: make(map[string]chan EventoSSE),
	}
}

// Registrar crea un canal nuevo para una conexión y lo guarda en el hub.
// idConexion debe ser único por conexión (ver generarIDConexion en el handler).
func (h *HubSSE) Registrar(idConexion string) chan EventoSSE {
	h.mu.Lock()
	defer h.mu.Unlock()

	canal := make(chan EventoSSE, tamañoBufferCliente)
	h.clientes[idConexion] = canal
	return canal
}

// Desregistrar saca del hub la conexión y cierra su canal. Se llama siempre
// que una conexión SSE termina (cliente desconectado, pestaña cerrada, etc.).
func (h *HubSSE) Desregistrar(idConexion string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if canal, existe := h.clientes[idConexion]; existe {
		delete(h.clientes, idConexion)
		close(canal)
	}
}

// Notificar hace broadcast de un evento a todos los clientes conectados.
// El envío es no bloqueante: si el buffer de algún cliente está lleno (está
// lento o colgado), se descarta el evento para ESE cliente en particular en
// vez de bloquear el broadcast para todos los demás.
func (h *HubSSE) Notificar(tipo string, datos interface{}) {
	h.mu.Lock()
	defer h.mu.Unlock()

	evento := EventoSSE{Tipo: tipo, Datos: datos}
	for _, canal := range h.clientes {
		select {
		case canal <- evento:
		default:
			// cliente saturado, se descarta el evento para no bloquear el resto
		}
	}
}

// NotificadorSSE es la interfaz que consumen los services de negocio
// (RemitoService, ResultadoAnalisisService, SolicitudEdicionService) para
// no depender directamente de HubSSE — mismo criterio que ya usás con las
// interfaces de repositorio en cada service.
type NotificadorSSE interface {
	Notificar(tipo string, datos interface{})
}
