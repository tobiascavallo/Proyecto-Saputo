package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CamioneroService interface {
	CrearCamionero(model models.Camionero) error
	ObtenerCamioneros() ([]models.Camionero, error)
	ObtenerCamioneroPorID(id primitive.ObjectID) (*models.Camionero, error)
	ObtenerCamioneroPorUsuarioID(usuarioID primitive.ObjectID, rolUsuario string, usuarioIDToken primitive.ObjectID) (*models.Camionero, error)
	ActualizarCamionero(id primitive.ObjectID, model models.Camionero) error
	DesactivarCamionero(id primitive.ObjectID) error
	ActivarCamionero(id primitive.ObjectID) error
	ObtenerDatosUsuario(usuarioID primitive.ObjectID) (nombre string, dni string, telefono string, email string)
	ObtenerNombreEmpresa(empresaID primitive.ObjectID) string
}

type CamioneroHandler struct {
	service CamioneroService
}

func NewCamioneroHandler(service CamioneroService) CamioneroHandler {
	return CamioneroHandler{service: service}
}

// enriquecer arma la respuesta de un Camionero resolviendo nombre/DNI/
// teléfono del usuario y el nombre de la empresa transportista, en vez de
// devolver los IDs crudos.
func (h CamioneroHandler) enriquecer(c models.Camionero) dto.CamioneroResponse {
	nombre, dni, telefono, email := h.service.ObtenerDatosUsuario(c.UsuarioID)
	nombreEmpresa := h.service.ObtenerNombreEmpresa(c.EmpresaTransportistaID)
	return dto.CamioneroToResponse(c, nombre, dni, telefono, email, nombreEmpresa)
}

func (h CamioneroHandler) CrearCamionero(c *gin.Context) {
	var req dto.CrearCamioneroRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	camionero, err := dto.CrearCamioneroRequestToModel(req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CrearCamionero(camionero); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"mensaje": "datos de camionero creados correctamente"})
}

func (h CamioneroHandler) ObtenerCamioneros(c *gin.Context) {
	camioneros, err := h.service.ObtenerCamioneros()
	if err != nil {
		c.JSON(500, gin.H{"error": "error al obtener camioneros"})
		return
	}

	var response []dto.CamioneroResponse
	for _, camionero := range camioneros {
		response = append(response, h.enriquecer(camionero))
	}

	c.JSON(200, response)
}

func (h CamioneroHandler) ObtenerCamioneroPorID(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	camionero, err := h.service.ObtenerCamioneroPorID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "camionero no encontrado"})
		return
	}

	c.JSON(200, h.enriquecer(*camionero))
}

func (h CamioneroHandler) ActualizarCamionero(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	var req dto.ActualizarCamioneroRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	camionero, err := dto.ActualizarCamioneroRequestToModel(req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ActualizarCamionero(id, camionero); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "datos de camionero actualizados correctamente"})
}

func (h CamioneroHandler) DesactivarCamionero(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.DesactivarCamionero(id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "camionero desactivado correctamente"})
}

func (h CamioneroHandler) ActivarCamionero(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.ActivarCamionero(id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "camionero activado correctamente"})
}

func (h CamioneroHandler) ObtenerCamioneroPorUsuarioID(c *gin.Context) {
	usuarioID, err := primitive.ObjectIDFromHex(c.Param("usuarioId"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID de usuario inválido"})
		return
	}

	rolUsuario, _ := c.Get("rol")
	usuarioIDTokenStr, _ := c.Get("usuario_id")
	usuarioIDToken, _ := primitive.ObjectIDFromHex(usuarioIDTokenStr.(string))

	camionero, err := h.service.ObtenerCamioneroPorUsuarioID(usuarioID, rolUsuario.(string), usuarioIDToken)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, h.enriquecer(*camionero))
}
