package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SolicitudEdicion struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty"`
	LineaRecoleccionID primitive.ObjectID `bson:"linea_recoleccion_id"`
	ValorActual        ValorRecoleccion   `bson:"valor_actual"`
	ValorPropuesto     ValorRecoleccion   `bson:"valor_propuesto"`
	Motivo             string             `bson:"motivo"`
	Estado             EstadoSolicitud    `bson:"estado"`
}

type EstadoSolicitud string

const (
	SolicitudPendiente EstadoSolicitud = "pendiente"
	SolicitudAprobada  EstadoSolicitud = "aprobada"
	SolicitudRechazada EstadoSolicitud = "rechazada"
)

type ValorRecoleccion struct {
	LitrosRecibidos     float64   `bson:"litros_recibidos"`
	TemperaturaCelcius  float64   `bson:"temperatura_celcius"`
	NumeroCisterna      int       `bson:"numero_cisterna"`
	HoraRecoleccion     time.Time `bson:"hora_recoleccion"`
	CodigoMuestraDiaria string    `bson:"codigo_muestra_diaria"`
	CodigoMuestraUFC    string    `bson:"codigo_muestra_ufc"`
}
