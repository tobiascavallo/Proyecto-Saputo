package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LineaRecoleccionService interface {
	CrearLineaRecoleccion(model models.LineaRecoleccion, camioneroID primitive.ObjectID) error
	ObtenerLineas() ([]models.LineaRecoleccion, error)
	ObtenerLineaPorID(id primitive.ObjectID) (*models.LineaRecoleccion, error)
	ObtenerLineasPorRemito(remitoID primitive.ObjectID) ([]models.LineaRecoleccion, error)
	ObtenerLineasPorTambo(tamboID primitive.ObjectID) ([]models.LineaRecoleccion, error)
	ObtenerLineasPorCisterna(remitoID primitive.ObjectID, numeroCisterna int) ([]models.LineaRecoleccion, error)
	ObtenerLineaPorCodigoMuestra(codigo string) (*models.LineaRecoleccion, error)
	ActualizarLineaRecoleccion(id primitive.ObjectID, model models.LineaRecoleccion) error
}

type LineaRecoleccionHandler struct {
	service LineaRecoleccionService
}

func NewLineaRecoleccionHandler(service LineaRecoleccionService) LineaRecoleccionHandler {
	return LineaRecoleccionHandler{service: service}
}

func (h LineaRecoleccionHandler) CrearLineaRecoleccion(c *gin.Context) {
	usuarioIDStr, _ := c.Get("usuario_id")
	camioneroID, _ := primitive.ObjectIDFromHex(usuarioIDStr.(string))

	var req dto.CrearLineaRecoleccionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	linea, err := dto.CrearLineaRecoleccionRequestToModel(req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CrearLineaRecoleccion(linea, camioneroID); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"mensaje": "línea de recolección creada correctamente"})
}

func (h LineaRecoleccionHandler) ObtenerLineas(c *gin.Context) {
	lineas, err := h.service.ObtenerLineas()
	if err != nil {
		c.JSON(500, gin.H{"error": "error al obtener líneas de recolección"})
		return
	}

	var response []dto.LineaRecoleccionResponse
	for _, l := range lineas {
		response = append(response, dto.LineaRecoleccionToResponse(l))
	}

	c.JSON(200, response)
}

func (h LineaRecoleccionHandler) ObtenerLineaPorID(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	linea, err := h.service.ObtenerLineaPorID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "línea de recolección no encontrada"})
		return
	}

	c.JSON(200, dto.LineaRecoleccionToResponse(*linea))
}

func (h LineaRecoleccionHandler) ObtenerLineasPorRemito(c *gin.Context) {
	remitoID, err := primitive.ObjectIDFromHex(c.Param("remitoId"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID de remito inválido"})
		return
	}

	lineas, err := h.service.ObtenerLineasPorRemito(remitoID)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}

	var response []dto.LineaRecoleccionResponse
	for _, l := range lineas {
		response = append(response, dto.LineaRecoleccionToResponse(l))
	}

	c.JSON(200, response)
}

func (h LineaRecoleccionHandler) ObtenerLineasPorTambo(c *gin.Context) {
	tamboID, err := primitive.ObjectIDFromHex(c.Param("tamboId"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID de tambo inválido"})
		return
	}

	lineas, err := h.service.ObtenerLineasPorTambo(tamboID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	var response []dto.LineaRecoleccionResponse
	for _, l := range lineas {
		response = append(response, dto.LineaRecoleccionToResponse(l))
	}

	c.JSON(200, response)
}

func (h LineaRecoleccionHandler) ObtenerLineasPorCisterna(c *gin.Context) {
	remitoID, err := primitive.ObjectIDFromHex(c.Param("remitoId"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID de remito inválido"})
		return
	}

	numeroCisternaStr := c.Query("numero_cisterna")
	if numeroCisternaStr == "" {
		c.JSON(400, gin.H{"error": "número de cisterna requerido"})
		return
	}

	numeroCisterna, err := strconv.Atoi(numeroCisternaStr)
	if err != nil || numeroCisterna <= 0 {
		c.JSON(400, gin.H{"error": "número de cisterna inválido"})
		return
	}

	lineas, err := h.service.ObtenerLineasPorCisterna(remitoID, numeroCisterna)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	var response []dto.LineaRecoleccionResponse
	for _, l := range lineas {
		response = append(response, dto.LineaRecoleccionToResponse(l))
	}

	c.JSON(200, response)
}

func (h LineaRecoleccionHandler) ObtenerLineaPorCodigoMuestra(c *gin.Context) {
	codigo := c.Query("codigo")
	if codigo == "" {
		c.JSON(400, gin.H{"error": "código de muestra requerido"})
		return
	}

	linea, err := h.service.ObtenerLineaPorCodigoMuestra(codigo)
	if err != nil {
		c.JSON(404, gin.H{"error": "línea no encontrada"})
		return
	}

	c.JSON(200, dto.LineaRecoleccionToResponse(*linea))
}

func (h LineaRecoleccionHandler) ActualizarLineaRecoleccion(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	var req dto.ActualizarLineaRecoleccionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	linea := dto.ActualizarLineaRecoleccionRequestToModel(req)

	if err := h.service.ActualizarLineaRecoleccion(id, linea); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "línea de recolección actualizada correctamente"})
}
