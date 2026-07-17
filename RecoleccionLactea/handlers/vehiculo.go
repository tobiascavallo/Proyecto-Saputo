package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type VehiculoService interface {
	CrearVehiculo(model models.Vehiculo) error
	ObtenerVehiculos() ([]models.Vehiculo, error)
	ObtenerVehiculoPorID(id primitive.ObjectID) (*models.Vehiculo, error)
	ActualizarVehiculo(id primitive.ObjectID, model models.Vehiculo) error
	DesactivarVehiculo(id primitive.ObjectID) error
	ObtenerVehiculosPorEmpresa(empresaID primitive.ObjectID) ([]models.Vehiculo, error)
}

type VehiculoHandler struct {
	service VehiculoService
}

func NewVehiculoHandler(service VehiculoService) VehiculoHandler {
	return VehiculoHandler{service: service}
}

func (h VehiculoHandler) CrearVehiculo(c *gin.Context) {
	var req dto.CrearVehiculoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	vehiculo, err := dto.CrearVehiculoRequestToModel(req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CrearVehiculo(vehiculo); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"mensaje": "vehículo creado correctamente"})
}

func (h VehiculoHandler) ObtenerVehiculos(c *gin.Context) {
	vehiculos, err := h.service.ObtenerVehiculos()
	if err != nil {
		c.JSON(500, gin.H{"error": "error al obtener vehículos"})
		return
	}

	var response []dto.VehiculoResponse
	for _, v := range vehiculos {
		response = append(response, dto.VehiculoToResponse(v))
	}

	c.JSON(200, response)
}

func (h VehiculoHandler) ObtenerVehiculoPorID(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	vehiculo, err := h.service.ObtenerVehiculoPorID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "vehículo no encontrado"})
		return
	}

	c.JSON(200, dto.VehiculoToResponse(*vehiculo))
}

func (h VehiculoHandler) ActualizarVehiculo(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	var req dto.ActualizarVehiculoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	vehiculo, err := dto.ActualizarVehiculoRequestToModel(req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ActualizarVehiculo(id, vehiculo); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "vehículo actualizado correctamente"})
}

func (h VehiculoHandler) DesactivarVehiculo(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.DesactivarVehiculo(id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "vehículo desactivado correctamente"})
}

func (h VehiculoHandler) ObtenerVehiculosPorEmpresa(c *gin.Context) {
	empresaID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID de empresa inválido"})
		return
	}

	vehiculos, err := h.service.ObtenerVehiculosPorEmpresa(empresaID)
	if err != nil {
		c.JSON(500, gin.H{"error": "error al obtener vehículos"})
		return
	}

	var response []dto.VehiculoResponse
	for _, v := range vehiculos {
		response = append(response, dto.VehiculoToResponse(v))
	}

	c.JSON(200, response)
}
