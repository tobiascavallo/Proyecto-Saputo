package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/utils"
)

// auth.go - Middleware de autenticación JWT.
// Intercepta cada request, extrae y valida el token del header Authorization.
// Si el token es válido, guarda el usuario_id y rol en el contexto de Gin
// para que los handlers puedan acceder a ellos.
// Si el token es inválido o expiró, devuelve 401 y corta el request.

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		partes := strings.Split(authHeader, " ")
		if len(partes) != 2 || partes[0] != "Bearer" {
			c.JSON(401, gin.H{"error": "token invalido"})
			c.Abort()
			return
		}
		tokenString := partes[1]

		claims, err := utils.ValidarToken(tokenString)
		if err != nil {
			c.JSON(401, gin.H{"error": "token invalido o expirado"})
			c.Abort()
			return
		}

		c.Set("usuario_id", claims.UsuarioID)
		c.Set("rol", claims.Rol)
		c.Next()
	}
}

// RequiereRol - Middleware de autorización por rol.
// Recibe los roles permitidos para un endpoint y verifica que el usuario
// tenga uno de esos roles. Si no tiene permiso, devuelve 403 y corta el request.
func RequiereRol(rolesPermitidos ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		rol, _ := c.Get("rol")
		for _, rolPermitido := range rolesPermitidos {
			if rol == rolPermitido {
				c.Next()
				return
			}
		}
		c.JSON(403, gin.H{"error": "no tenes permiso para realizar esta accion"})
		c.Abort()
	}
}
