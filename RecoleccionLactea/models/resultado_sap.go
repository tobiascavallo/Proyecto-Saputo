package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ResultadoSAP simula los datos que vendría del sistema SAP de la empresa láctea.
// En producción esta colección sería reemplazada por una integración real con SAP vía API.
type ResultadoSAP struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	CodigoMuestra string             `bson:"codigo_muestra"`
	TipoMuestra   TipoMuestra        `bson:"tipo_muestra"`
	Resultado     Resultado          `bson:"resultado"`
	Observaciones string             `bson:"observaciones"`
	FechaAnalisis time.Time          `bson:"fecha_analisis"`
}
