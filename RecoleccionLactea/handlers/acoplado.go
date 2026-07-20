package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AcopladoService interface {
	CrearAcoplado(model models.Acoplado) error
	ObtenerAcoplados() ([]models.Acoplado, error)
	ObtenerAcopladoPorID(id primitive.ObjectID) (*models.Acoplado, error)
	ActualizarAcoplado(id primitive.ObjectID, model models.Acoplado) error
	DesactivarAcoplado(id primitive.ObjectID) error
	ObtenerAcopladosPorEmpresa(empresaID primitive.ObjectID) ([]models.Acoplado, error)
}

type AcopladoHandler struct {
	service AcopladoService
}

func NewAcopladoHandler(service AcopladoService) AcopladoHandler {
	return AcopladoHandler{service: service}
}

func (h AcopladoHandler) CrearAcoplado(c *gin.Context) {
	var req dto.CrearAcopladoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	acoplado, err := dto.CrearAcopladoRequestToModel(req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CrearAcoplado(acoplado); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"mensaje": "acoplado creado correctamente"})
}

func (h AcopladoHandler) ObtenerAcoplados(c *gin.Context) {
	acoplados, err := h.service.ObtenerAcoplados()
	if err != nil {
		c.JSON(500, gin.H{"error": "error al obtener acoplados"})
		return
	}

	var response []dto.AcopladoResponse
	for _, a := range acoplados {
		response = append(response, dto.AcopladoToResponse(a))
	}

	c.JSON(200, response)
}

func (h AcopladoHandler) ObtenerAcopladoPorID(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	acoplado, err := h.service.ObtenerAcopladoPorID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "acoplado no encontrado"})
		return
	}

	c.JSON(200, dto.AcopladoToResponse(*acoplado))
}

func (h AcopladoHandler) ActualizarAcoplado(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	var req dto.ActualizarAcopladoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	acoplado, err := dto.ActualizarAcopladoRequestToModel(req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ActualizarAcoplado(id, acoplado); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "acoplado actualizado correctamente"})
}

func (h AcopladoHandler) DesactivarAcoplado(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.DesactivarAcoplado(id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "acoplado desactivado correctamente"})
}

func (h AcopladoHandler) ObtenerAcopladosPorEmpresa(c *gin.Context) {
	empresaID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID de empresa inválido"})
		return
	}

	acoplados, err := h.service.ObtenerAcopladosPorEmpresa(empresaID)
	if err != nil {
		c.JSON(500, gin.H{"error": "error al obtener acoplados"})
		return
	}

	var response []dto.AcopladoResponse
	for _, a := range acoplados {
		response = append(response, dto.AcopladoToResponse(a))
	}

	c.JSON(200, response)
}
