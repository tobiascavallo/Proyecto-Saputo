package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Vehiculo struct {
	ID                     primitive.ObjectID `bson:"_id,omitempty"`
	Patente                string             `bson:"patente"`
	HabilitacionSenasa     string             `bson:"habilitacion_senasa"`
	Tipo                   TipoVehiculo       `bson:"tipo"`
	TieneCisternaPropia    bool               `bson:"tiene_cisterna_propia"`
	EmpresaTransportistaID primitive.ObjectID `bson:"empresa_transportista_id"`
}

type TipoVehiculo string

const (
	Camion              TipoVehiculo = "camion"
	TractorSemiRemolque TipoVehiculo = "tractor_semirremolque"
)
