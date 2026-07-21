package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Tambero struct {
	ID       primitive.ObjectID `bson:"_id,omitempty"`
	Nombre   string             `bson:"nombre"`
	Cuit     string             `bson:"cuit"`
	Telefono string             `bson:"telefono"`
	Email    string             `bson:"email"`
	Activo   bool               `bson:"activo"`
}
