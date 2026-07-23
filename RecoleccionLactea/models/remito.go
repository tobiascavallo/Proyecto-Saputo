package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Remito struct {
	ID                     primitive.ObjectID   `bson:"_id,omitempty"`
	NumeroRemito           int                  `bson:"numero_remito"`
	NumeroRecorrido        int                  `bson:"numero_recorrido"`
	Fecha                  time.Time            `bson:"fecha"`
	CamioneroID            primitive.ObjectID   `bson:"camionero_id"`
	VehiculoID             primitive.ObjectID   `bson:"vehiculo_id"`
	AcopladoID             primitive.ObjectID   `bson:"acoplado_id,omitempty"`
	EstadoSincronizacion   EstadoSincronizacion `bson:"estado_sincronizacion"`
	EstadoRemito           EstadoRemito         `bson:"estado_remito"`
	EmpresaTransportistaID primitive.ObjectID   `bson:"empresa_transportista_id"`
	CreadoOffline          bool                 `bson:"creado_offline"`
}

type EstadoSincronizacion string

const (
	EstadoPendiente    EstadoSincronizacion = "pendiente"
	EstadoSincronizado EstadoSincronizacion = "sincronizado"
)

type EstadoRemito string

const (
	EstadoRemitoEnCurso    EstadoRemito = "en_curso"
	EstadoRemitoFinalizado EstadoRemito = "finalizado"
)
