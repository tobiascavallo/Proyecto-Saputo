package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TamboService interface {
	CrearTambo(model models.Tambo) error
	ObtenerTambos() ([]models.Tambo, error)
	ObtenerTamboPorID(id primitive.ObjectID) (*models.Tambo, error)
	ObtenerTambosPorTambero(id primitive.ObjectID) ([]models.Tambo, error)
	ObtenerTamboPorNumeroTambo(numero int) (*models.Tambo, error)
	ActualizarTambo(id primitive.ObjectID, model models.Tambo) error
	DesactivarTambo(id primitive.ObjectID) error
}

type TamboHandler struct {
	service TamboService
}

func NewTamboHandler(service TamboService) TamboHandler {
	return TamboHandler{service: service}
}

func (h TamboHandler) CrearTambo(c *gin.Context) {
	var req dto.CrearTamboRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	tamberoID, err := primitive.ObjectIDFromHex(req.TamberoID)
	if err != nil {
		c.JSON(400, gin.H{"error": "ID de tambero inválido"})
		return
	}

	tambo := models.Tambo{
		NumeroTambo: req.NumeroTambo,
		TamberoID:   tamberoID,
	}

	if err := h.service.CrearTambo(tambo); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"mensaje": "tambo creado correctamente"})
}

func (h TamboHandler) ObtenerTambos(c *gin.Context) {
	tambos, err := h.service.ObtenerTambos()
	if err != nil {
		c.JSON(500, gin.H{"error": "error al obtener tambos"})
		return
	}

	var response []dto.TamboResponseDTO
	for _, t := range tambos {
		response = append(response, dto.TamboToResponse(t))
	}

	c.JSON(200, response)
}

func (h TamboHandler) ObtenerTamboPorID(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	tambo, err := h.service.ObtenerTamboPorID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "tambo no encontrado"})
		return
	}

	c.JSON(200, dto.TamboToResponse(*tambo))
}

func (h TamboHandler) ObtenerTambosPorTambero(c *gin.Context) {
	tamberoID, err := primitive.ObjectIDFromHex(c.Param("tamberoId"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID de tambero inválido"})
		return
	}

	tambos, err := h.service.ObtenerTambosPorTambero(tamberoID)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}

	var response []dto.TamboResponseDTO
	for _, t := range tambos {
		response = append(response, dto.TamboToResponse(t))
	}

	c.JSON(200, response)
}

func (h TamboHandler) ObtenerTamboPorNumeroTambo(c *gin.Context) {
	numeroStr := c.Param("numero")
	numero, err := strconv.Atoi(numeroStr)
	if err != nil || numero <= 0 {
		c.JSON(400, gin.H{"error": "número de tambo inválido"})
		return
	}

	tambo, err := h.service.ObtenerTamboPorNumeroTambo(numero)
	if err != nil {
		c.JSON(404, gin.H{"error": "tambo no encontrado"})
		return
	}

	c.JSON(200, dto.TamboToResponse(*tambo))
}

func (h TamboHandler) ActualizarTambo(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	var req dto.ActualizarTamboRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	var tambo models.Tambo

	if req.NumeroTambo != nil {
		tambo.NumeroTambo = *req.NumeroTambo
	}

	if req.TamberoID != nil {
		tamberoID, err := primitive.ObjectIDFromHex(*req.TamberoID)
		if err != nil {
			c.JSON(400, gin.H{"error": "ID de tambero inválido"})
			return
		}
		tambo.TamberoID = tamberoID
	}

	if err := h.service.ActualizarTambo(id, tambo); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "tambo actualizado correctamente"})
}

func (h TamboHandler) DesactivarTambo(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.DesactivarTambo(id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "tambo desactivado correctamente"})
}
