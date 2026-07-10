package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ResultadoAnalisis struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty"`
	LineaRecoleccionID primitive.ObjectID `bson:"linea_recoleccion_id"`
	TipoMuestra        TipoMuestra        `bson:"tipo_muestra"`
	Resultado          Resultado          `bson:"resultado"`
	Observaciones      string             `bson:"observaciones"`
	FechaCarga         time.Time          `bson:"fecha_carga"`
	EncargadoID        primitive.ObjectID `bson:"encargado_id"`
}

type TipoMuestra string

const (
	TipoMuestraDiaria TipoMuestra = "diaria"
	TipoMuestraUFC    TipoMuestra = "ufc"
)

type Resultado string

const (
	ResultadoPendiente   Resultado = "pendiente"
	ResultadoApta        Resultado = "apta"
	ResultadoContaminada Resultado = "contaminada"
)
