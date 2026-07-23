package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SolicitudEdicionService interface {
	CrearSolicitud(model models.SolicitudEdicion, camioneroID primitive.ObjectID) error
	ObtenerSolicitudes() ([]models.SolicitudEdicion, error)
	ObtenerSolicitudPorID(id primitive.ObjectID) (*models.SolicitudEdicion, error)
	ObtenerSolicitudesPorCamionero(camioneroID primitive.ObjectID) ([]models.SolicitudEdicion, error)
	TomarDecision(id primitive.ObjectID, estado models.EstadoSolicitud) error
}

type SolicitudEdicionHandler struct {
	service SolicitudEdicionService
}

func NewSolicitudEdicionHandler(service SolicitudEdicionService) SolicitudEdicionHandler {
	return SolicitudEdicionHandler{service: service}
}

func (h SolicitudEdicionHandler) CrearSolicitud(c *gin.Context) {
	usuarioIDStr, _ := c.Get("usuario_id")
	camioneroID, _ := primitive.ObjectIDFromHex(usuarioIDStr.(string))

	var req dto.CrearSolicitudEdicionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	solicitud, err := dto.CrearSolicitudEdicionRequestToModel(req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CrearSolicitud(solicitud, camioneroID); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"mensaje": "solicitud de edición creada correctamente"})
}

func (h SolicitudEdicionHandler) ObtenerSolicitudes(c *gin.Context) {
	rolUsuario, _ := c.Get("rol")
	usuarioIDStr, _ := c.Get("usuario_id")
	camioneroID, _ := primitive.ObjectIDFromHex(usuarioIDStr.(string))

	var solicitudes []models.SolicitudEdicion
	var err error

	if rolUsuario.(string) == string(models.RolCamionero) {
		solicitudes, err = h.service.ObtenerSolicitudesPorCamionero(camioneroID)
	} else {
		solicitudes, err = h.service.ObtenerSolicitudes()
	}

	if err != nil {
		c.JSON(500, gin.H{"error": "error al obtener solicitudes"})
		return
	}

	var response []dto.SolicitudEdicionResponse
	for _, s := range solicitudes {
		response = append(response, dto.SolicitudEdicionToResponse(s))
	}

	c.JSON(200, response)
}

func (h SolicitudEdicionHandler) ObtenerSolicitudPorID(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	solicitud, err := h.service.ObtenerSolicitudPorID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "solicitud no encontrada"})
		return
	}

	c.JSON(200, dto.SolicitudEdicionToResponse(*solicitud))
}

func (h SolicitudEdicionHandler) TomarDecision(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	var req dto.DecisionSolicitudRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	if err := h.service.TomarDecision(id, models.EstadoSolicitud(req.Decision)); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "decisión registrada correctamente"})
}
