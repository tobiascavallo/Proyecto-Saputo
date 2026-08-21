package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RemitoService interface {
	CrearRemito(model models.Remito) (models.Remito, error)
	ObtenerRemitos(rolUsuario string, camioneroID primitive.ObjectID, estado string, camioneroIDFiltro string) ([]models.Remito, error)
	ObtenerRemitoPorID(id primitive.ObjectID, rolUsuario string, camioneroID primitive.ObjectID) (*models.Remito, error)
	ObtenerRemitosPorEstado(camioneroID primitive.ObjectID, estado models.EstadoRemito) ([]models.Remito, error)
	FinalizarRemito(id primitive.ObjectID) error
	SincronizarRemito(id primitive.ObjectID) error
}

type RemitoHandler struct {
	service RemitoService
}

func NewRemitoHandler(service RemitoService) RemitoHandler {
	return RemitoHandler{service: service}
}
func (h RemitoHandler) CrearRemito(c *gin.Context) {
	usuarioIDStr, _ := c.Get("usuario_id")
	camioneroID, _ := primitive.ObjectIDFromHex(usuarioIDStr.(string))

	var req dto.CrearRemitoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	remito, err := dto.CrearRemitoRequestToModel(req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	remito.CamioneroID = camioneroID

	remitoCreado, err := h.service.CrearRemito(remito)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{
		"mensaje": "remito creado correctamente",
		"remito":  dto.RemitoToResponse(remitoCreado),
	})
}

// ObtenerRemitos — endpoint único de listado de remitos.
// El rol (camionero vs resto) viene del JWT, no lo manda el frontend.
// Acepta ?estado=en_curso|finalizado y ?camionero_id=... como filtros
// opcionales y combinables en la query string. Si quien pregunta es
// camionero, camionero_id se ignora — el service fuerza su propio ID.
func (h RemitoHandler) ObtenerRemitos(c *gin.Context) {
	rolUsuario, _ := c.Get("rol")
	usuarioIDStr, _ := c.Get("usuario_id")
	camioneroID, _ := primitive.ObjectIDFromHex(usuarioIDStr.(string))
	estado := c.Query("estado")             // vacío = sin filtro
	camioneroIDFiltro := c.Query("camionero_id") // vacío = sin filtro

	remitos, err := h.service.ObtenerRemitos(rolUsuario.(string), camioneroID, estado, camioneroIDFiltro)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	var response []dto.RemitoResponse
	for _, r := range remitos {
		response = append(response, dto.RemitoToResponse(r))
	}

	c.JSON(200, response)
}

func (h RemitoHandler) ObtenerRemitoPorID(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	rolUsuario, _ := c.Get("rol")
	usuarioIDStr, _ := c.Get("usuario_id")
	camioneroID, _ := primitive.ObjectIDFromHex(usuarioIDStr.(string))

	remito, err := h.service.ObtenerRemitoPorID(id, rolUsuario.(string), camioneroID)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, dto.RemitoToResponse(*remito))
}

func (h RemitoHandler) ObtenerRemitosPorEstado(c *gin.Context) {
	usuarioIDStr, _ := c.Get("usuario_id")
	camioneroID, _ := primitive.ObjectIDFromHex(usuarioIDStr.(string))

	estado := models.EstadoRemito(c.Query("estado"))
	if estado == "" {
		c.JSON(400, gin.H{"error": "estado requerido"})
		return
	}

	remitos, err := h.service.ObtenerRemitosPorEstado(camioneroID, estado)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	var response []dto.RemitoResponse
	for _, r := range remitos {
		response = append(response, dto.RemitoToResponse(r))
	}

	c.JSON(200, response)
}

func (h RemitoHandler) FinalizarRemito(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.FinalizarRemito(id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "remito finalizado correctamente"})
}

func (h RemitoHandler) SincronizarRemito(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.SincronizarRemito(id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "remito sincronizado correctamente"})
}
