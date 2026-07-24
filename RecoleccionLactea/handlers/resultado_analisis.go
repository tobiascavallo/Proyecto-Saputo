package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ResultadoAnalisisService interface {
	ObtenerResultadoDesdeSAP(codigo string, encargadoID primitive.ObjectID) error
	ObtenerResultados(estado string) ([]models.ResultadoAnalisis, error)
	ObtenerResultadoPorID(id primitive.ObjectID) (*models.ResultadoAnalisis, error)
	ObtenerResultadosPorLinea(lineaID primitive.ObjectID) ([]models.ResultadoAnalisis, error)
	ActualizarResultado(id primitive.ObjectID, model models.ResultadoAnalisis) error
}

type ResultadoAnalisisHandler struct {
	service ResultadoAnalisisService
}

func NewResultadoAnalisisHandler(service ResultadoAnalisisService) ResultadoAnalisisHandler {
	return ResultadoAnalisisHandler{service: service}
}

func (h ResultadoAnalisisHandler) ObtenerResultadoDesdeSAP(c *gin.Context) {
	usuarioIDStr, _ := c.Get("usuario_id")
	encargadoID, _ := primitive.ObjectIDFromHex(usuarioIDStr.(string))

	codigo := c.Query("codigo")
	if codigo == "" {
		c.JSON(400, gin.H{"error": "código de muestra requerido"})
		return
	}

	if err := h.service.ObtenerResultadoDesdeSAP(codigo, encargadoID); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"mensaje": "resultado obtenido y registrado correctamente"})
}

func (h ResultadoAnalisisHandler) ObtenerResultados(c *gin.Context) {
	estado := c.Query("estado")

	resultados, err := h.service.ObtenerResultados(estado)
	if err != nil {
		c.JSON(500, gin.H{"error": "error al obtener resultados"})
		return
	}

	var response []dto.ResultadoAnalisisResponse
	for _, r := range resultados {
		response = append(response, dto.ResultadoAnalisisToResponse(r))
	}

	c.JSON(200, response)
}

func (h ResultadoAnalisisHandler) ObtenerResultadoPorID(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	resultado, err := h.service.ObtenerResultadoPorID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "resultado no encontrado"})
		return
	}

	c.JSON(200, dto.ResultadoAnalisisToResponse(*resultado))
}

func (h ResultadoAnalisisHandler) ObtenerResultadosPorLinea(c *gin.Context) {
	lineaID, err := primitive.ObjectIDFromHex(c.Param("lineaId"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID de línea inválido"})
		return
	}

	resultados, err := h.service.ObtenerResultadosPorLinea(lineaID)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}

	var response []dto.ResultadoAnalisisResponse
	for _, r := range resultados {
		response = append(response, dto.ResultadoAnalisisToResponse(r))
	}

	c.JSON(200, response)
}

func (h ResultadoAnalisisHandler) ActualizarResultado(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	var req dto.ActualizarResultadoAnalisisRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	resultado := dto.ActualizarResultadoAnalisisRequestToModel(req)

	if err := h.service.ActualizarResultado(id, resultado); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "resultado actualizado correctamente"})
}
