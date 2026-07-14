package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// RefreshToken representa un token de renovación guardado en MongoDB.
// Permite invalidar sesiones específicas y detectar reutilización de tokens robados.
type RefreshToken struct {
	ID              primitive.ObjectID `bson:"_id,omitempty"`
	Token           string             `bson:"token"`
	UsuarioID       primitive.ObjectID `bson:"usuario_id"`
	Activo          bool               `bson:"activo"`
	FechaExpiracion time.Time          `bson:"fecha_expiracion"`
	FechaCreacion   time.Time          `bson:"fecha_creacion"`
}
