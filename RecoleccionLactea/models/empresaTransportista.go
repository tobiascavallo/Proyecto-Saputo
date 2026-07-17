package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type EmpresaTransportista struct {
    ID        primitive.ObjectID `bson:"_id,omitempty"`
    Nombre    string             `bson:"nombre"`
    Cuit      string             `bson:"cuit"`
    Domicilio string             `bson:"domicilio"`
    Activo    bool               `bson:"activo"`
}
