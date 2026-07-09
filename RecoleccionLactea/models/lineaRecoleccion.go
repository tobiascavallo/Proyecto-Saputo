package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LineaRecoleccion struct {
	ID                  primitive.ObjectID `bson:"_id,omitempty"`
	RemitoID            primitive.ObjectID `bson:"remito_id"`
	TamboID             primitive.ObjectID `bson:"tambo_id"`
	LitrosRecibidos     float64            `bson:"litros_recibidos"`
	TemperaturaCelcius  float64            `bson:"temperatura_celcius"`
	NumeroCisterna      int                `bson:"numero_cisterna"`
	HoraRecoleccion     time.Time          `bson:"hora_recoleccion"`
	CodigoMuestraDiaria string             `bson:"codigo_muestra_diaria"` //string (alfanumerico) o int? (solo numeros)
	CodigoMuestraUFC    string             `bson:"codigo_muestra_ufc"`    //string (alfanumerico) o int? (solo numeros)
}
