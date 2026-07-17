package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EmpresaTransportistaService interface {
	CrearEmpresaTransportista(model models.EmpresaTransportista) error
	ObtenerEmpresasTransportistas() ([]models.EmpresaTransportista, error)
	ObtenerEmpresaTransportistaPorId(id primitive.ObjectID) (*models.EmpresaTransportista, error)
	ActualizarEmpresaTransportista(id primitive.ObjectID, model models.EmpresaTransportista) error
	DesactivarEmpresaTransportista(id primitive.ObjectID) error
}

type EmpresaTransportistaHandler struct {
	service EmpresaTransportistaService
}

func NewEmpresaTransportistaHandler(service EmpresaTransportistaService) EmpresaTransportistaHandler {
	return EmpresaTransportistaHandler{service: service}
}

func (h EmpresaTransportistaHandler) CrearEmpresaTransportista(c *gin.Context) {
	var req dto.EmpresaTransportistaRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	model, err := dto.EmpresaTransportistaRequestToModel(req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CrearEmpresaTransportista(model); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"mensaje": "empresa transportista creada correctamente"})
}

func (h EmpresaTransportistaHandler) ObtenerEmpresasTransportistas(c *gin.Context) {
	empresas, err := h.service.ObtenerEmpresasTransportistas()
	if err != nil {
		c.JSON(500, gin.H{"error": "error al obtener las empresas transportistas"})
		return
	}

	var response []dto.EmpresaTransportistaResponseDTO
	for _, e := range empresas {
		response = append(response, dto.EmpresaTransportistaToResponse(e))
	}
	c.JSON(200, response)
}

func (h EmpresaTransportistaHandler) ObtenerEmpresaTransportistaPorId(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	empresa, err := h.service.ObtenerEmpresaTransportistaPorId(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "empresa transportista no encontrada"})
		return
	}

	c.JSON(200, dto.EmpresaTransportistaToResponse(*empresa))
}

func (h EmpresaTransportistaHandler) ActualizarEmpresaTransportista(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	var req dto.EmpresaTransportistaUpdateDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	model, err := dto.EmpresaTransportistaUpdateToModel(req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ActualizarEmpresaTransportista(id, model); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "empresa transportista actualizada correctamente"})
}

func (h EmpresaTransportistaHandler) DesactivarEmpresaTransportista(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.DesactivarEmpresaTransportista(id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "empresa transportista desactivada correctamente"})
}