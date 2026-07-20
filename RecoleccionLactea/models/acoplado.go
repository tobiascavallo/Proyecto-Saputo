package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Acoplado struct {
	ID                     primitive.ObjectID `bson:"_id,omitempty"`
	Patente                string             `bson:"patente"`
	HabilitacionSenasa     string             `bson:"habilitacion_senasa"` //id?
	Tipo                   TipoAcoplado       `bson:"tipo"`
	EmpresaTransportistaID primitive.ObjectID `bson:"empresa_transportista_id"`
	Activo                 bool               `bson:"activo"`
}

type TipoAcoplado string

const (
	AcopladoSimple TipoAcoplado = "acoplado"
	Semiremolque   TipoAcoplado = "semiremolque"
)
