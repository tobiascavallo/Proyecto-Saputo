package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Tambo struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	NumeroTambo   int                `bson:"numero_tambo"`
	TamberoNombre string             `bson:"tambero_nombre"`
	TamberoID     primitive.ObjectID `bson:"tambero_id,omitempty" json:"tamberoId,omitempty"` //reservado para verion futura, por eso el omitempty en el tag bson y json.
}
