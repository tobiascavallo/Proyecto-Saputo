package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TamberoService interface {
	CrearTambero(model models.Tambero) error
	ObtenerTamberos() ([]models.Tambero, error)
	ObtenerTamberoPorID(id primitive.ObjectID) (*models.Tambero, error)
	ObtenerTamberoPorEmail(email string) (*models.Tambero, error)
	ObtenerTamberoPorTelefono(telefono string) (*models.Tambero, error)
	ObtenerTamberoPorCuit(cuit string) (*models.Tambero, error)
	ActualizarTambero(id primitive.ObjectID, model models.Tambero) error
	DesactivarTambero(id primitive.ObjectID) error
}

type TamberoHandler struct {
	service TamberoService
}

func NewTamberoHandler(service TamberoService) TamberoHandler {
	return TamberoHandler{service: service}
}

func (h TamberoHandler) CrearTambero(c *gin.Context) {
	var req dto.CrearTamberoRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	tambero := models.Tambero{
		Nombre:   req.Nombre,
		Email:    req.Email,
		Cuit:     req.Cuit,
		Telefono: req.Telefono,
	}

	if err := h.service.CrearTambero(tambero); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"mensaje": "tambero creado correctamente"})
}

func (h TamberoHandler) ObtenerTamberos(c *gin.Context) {
	tamberos, err := h.service.ObtenerTamberos()
	if err != nil {
		c.JSON(500, gin.H{"error": "error al obtener tamberos"})
		return
	}

	var response []dto.TamberoResponseDTO
	for _, u := range tamberos {
		response = append(response, dto.TamberoToResponse(u))
	}

	c.JSON(200, response)
}

func (h TamberoHandler) ObtenerTamberoPorID(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	tambero, err := h.service.ObtenerTamberoPorID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "tambero no encontrado"})
		return
	}

	c.JSON(200, dto.TamberoToResponse(*tambero))
}

func (h TamberoHandler) ObtenerTamberoPorEmail(c *gin.Context) {
	email := c.Param("email")

	tambero, err := h.service.ObtenerTamberoPorEmail(email)
	if err != nil {
		c.JSON(404, gin.H{"error": "tambero no encontrado"})
		return
	}

	c.JSON(200, dto.TamberoToResponse(*tambero))
}

func (h TamberoHandler) ObtenerTamberoPorCuit(c *gin.Context) {
	cuit := c.Param("cuit")

	tambero, err := h.service.ObtenerTamberoPorCuit(cuit)
	if err != nil {
		c.JSON(404, gin.H{"error": "tambero no encontrado"})
		return
	}

	c.JSON(200, dto.TamberoToResponse(*tambero))
}

func (h TamberoHandler) ObtenerTamberoPorTelefono(c *gin.Context) {
	telefono := c.Param("telefono")

	tambero, err := h.service.ObtenerTamberoPorTelefono(telefono)
	if err != nil {
		c.JSON(404, gin.H{"error": "tambero no encontrado"})
		return
	}

	c.JSON(200, dto.TamberoToResponse(*tambero))
}

func (h TamberoHandler) ActualizarTambero(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	var req dto.ActualizarTamberoRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	var tambero models.Tambero
	if req.Nombre != nil {
		tambero.Nombre = *req.Nombre
	}
	if req.Cuit != nil {
		tambero.Cuit = *req.Cuit
	}
	if req.Telefono != nil {
		tambero.Telefono = *req.Telefono
	}
	if req.Email != nil {
		tambero.Email = *req.Email
	}

	if err := h.service.ActualizarTambero(id, tambero); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "tambero actualizado correctamente"})
}

func (h TamberoHandler) DesactivarTambero(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.DesactivarTambero(id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "tambero desactivado correctamente"})
}
