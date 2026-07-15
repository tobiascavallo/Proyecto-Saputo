package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UsuarioService interface {
	CrearUsuario(model models.Usuario) error
	ObtenerUsuarios() ([]models.Usuario, error)
	ObtenerUsuarioPorID(id primitive.ObjectID) (*models.Usuario, error)
	ActualizarUsuario(id primitive.ObjectID, model models.Usuario) error
	DesactivarUsuario(id primitive.ObjectID) error
}

type UsuarioHandler struct {
	service UsuarioService
}

func NewUsuarioHandler(service UsuarioService) UsuarioHandler {
	return UsuarioHandler{service: service}
}

func (h UsuarioHandler) CrearUsuario(c *gin.Context) {
	var req dto.CrearUsuarioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	usuario := models.Usuario{
		Nombre:     req.Nombre,
		Apellido:   req.Apellido,
		Email:      req.Email,
		Contraseña: req.Contrasena,
		Rol:        models.Rol(req.Rol),
	}

	if err := h.service.CrearUsuario(usuario); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"mensaje": "usuario creado correctamente"})
}

func (h UsuarioHandler) ObtenerUsuarios(c *gin.Context) {
	usuarios, err := h.service.ObtenerUsuarios()
	if err != nil {
		c.JSON(500, gin.H{"error": "error al obtener usuarios"})
		return
	}

	var response []dto.UsuarioResponse
	for _, u := range usuarios {
		response = append(response, dto.UsuarioToResponse(u))
	}

	c.JSON(200, response)
}

func (h UsuarioHandler) ObtenerUsuarioPorID(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	usuario, err := h.service.ObtenerUsuarioPorID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "usuario no encontrado"})
		return
	}

	c.JSON(200, dto.UsuarioToResponse(*usuario))
}

func (h UsuarioHandler) ActualizarUsuario(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	var req dto.ActualizarUsuarioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	usuario := models.Usuario{
		Nombre:     req.Nombre,
		Apellido:   req.Apellido,
		Email:      req.Email,
		Contraseña: req.Contrasena,
		Rol:        models.Rol(req.Rol),
	}

	if err := h.service.ActualizarUsuario(id, usuario); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "usuario actualizado correctamente"})
}

func (h UsuarioHandler) DesactivarUsuario(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.DesactivarUsuario(id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"mensaje": "usuario desactivado correctamente"})
}
