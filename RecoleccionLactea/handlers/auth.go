package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
)

type AuthService interface {
	Login(email string, contraseña string) (string, string, error)
	Refresh(tokenRefresh string) (string, string, error)
	Logout(tokenRefresh string) error
}

type AuthHandler struct {
	service AuthService
}

func NewAuthHandler(service AuthService) AuthHandler {
	return AuthHandler{service: service}
}

func (h AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	token, refreshToken, err := h.service.Login(req.Email, req.Contraseña)
	if err != nil {
		c.JSON(401, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{
		"token":         token,
		"refresh_token": refreshToken,
	})
}

func (h AuthHandler) Refresh(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	token, refreshToken, err := h.service.Refresh(req.RefreshToken)
	if err != nil {
		c.JSON(401, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"token":         token,
		"refresh_token": refreshToken,
	})
}

func (h AuthHandler) Logout(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "datos inválidos"})
		return
	}

	err := h.service.Logout(req.RefreshToken)
	if err != nil {
		c.JSON(500, gin.H{"error": "error al cerrar sesión"})
		return
	}

	c.JSON(200, gin.H{"mensaje": "sesión cerrada correctamente"})
}
