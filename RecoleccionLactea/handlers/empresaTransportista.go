package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
)

type EmpresaTransportistaService interface {
	CrearEmpresaTransportista(empresa dto.EmpresaTransportistaRequestDTO) error
	ObtenerEmpresasTransportistas() ([]*dto.EmpresaTransportistaResponseDTO, error)
	ObtenerEmpresaTransportistaPorId(id string) (*dto.EmpresaTransportistaResponseDTO, error)
	ActualizarEmpresaTransportista(id string, empresa dto.EmpresaTransportistaUpdateDTO) error
	EliminarEmpresaTransportista(id string) error
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

	if err := h.service.CrearEmpresaTransportista(req); err != nil {
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

	c.JSON(200, empresas)
}

func (h EmpresaTransportistaHandler) ObtenerEmpresaTransportistaPorId(c *gin.Context) {
	id := c.Param("id")

	empresa, err := h.service.ObtenerEmpresaTransportistaPorId(id)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, empresa)
}

func (h EmpresaTransportistaHandler) ActualizarEmpresaTransportista(c *gin.Context) {
	id := c.Param("id")

	var req dto.EmpresaTransportistaUpdateDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	if err := h.service.ActualizarEmpresaTransportista(id, req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "empresa transportista actualizada correctamente"})
}

func (h EmpresaTransportistaHandler) EliminarEmpresaTransportista(c *gin.Context) {
	id := c.Param("id")

	if err := h.service.EliminarEmpresaTransportista(id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "empresa transportista eliminada correctamente"})
}
