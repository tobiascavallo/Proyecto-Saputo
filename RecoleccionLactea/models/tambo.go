package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Tambo struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	NumeroTambo int                `bson:"numero_tambo"`
	TamberoID   primitive.ObjectID `bson:"tambero_id,omitempty"` //reservado para versión futura
	Activo      bool               `bson:"activo"`
}
