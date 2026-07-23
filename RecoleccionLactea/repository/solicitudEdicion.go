package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SolicitudEdicionRepositoryImpl struct{}

func (r SolicitudEdicionRepositoryImpl) CrearSolicitud(cfg config.Config, model models.SolicitudEdicion) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("solicitudes_edicion")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}

func (r SolicitudEdicionRepositoryImpl) ObtenerSolicitudes(cfg config.Config) ([]models.SolicitudEdicion, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("solicitudes_edicion")
	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		return nil, err
	}
	var solicitudes []models.SolicitudEdicion
	err = cursor.All(context.TODO(), &solicitudes)
	return solicitudes, err
}

func (r SolicitudEdicionRepositoryImpl) ObtenerSolicitudPorID(cfg config.Config, id primitive.ObjectID) (*models.SolicitudEdicion, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("solicitudes_edicion")
	var solicitud models.SolicitudEdicion
	err := collection.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&solicitud)
	if err != nil {
		return nil, err
	}
	return &solicitud, nil
}

func (r SolicitudEdicionRepositoryImpl) ObtenerSolicitudesPorCamionero(cfg config.Config, camioneroID primitive.ObjectID) ([]models.SolicitudEdicion, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("solicitudes_edicion")
	cursor, err := collection.Find(context.TODO(), bson.M{"camionero_id": camioneroID})
	if err != nil {
		return nil, err
	}
	var solicitudes []models.SolicitudEdicion
	err = cursor.All(context.TODO(), &solicitudes)
	return solicitudes, err
}

func (r SolicitudEdicionRepositoryImpl) ObtenerSolicitudAprobadaPorLinea(cfg config.Config, lineaID primitive.ObjectID) (*models.SolicitudEdicion, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("solicitudes_edicion")
	var solicitud models.SolicitudEdicion
	err := collection.FindOne(context.TODO(), bson.M{
		"linea_recoleccion_id": lineaID,
		"estado":               models.SolicitudAprobada,
	}).Decode(&solicitud)
	if err != nil {
		return nil, err
	}
	return &solicitud, nil
}

func (r SolicitudEdicionRepositoryImpl) ActualizarEstadoSolicitud(cfg config.Config, id primitive.ObjectID, estado models.EstadoSolicitud) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("solicitudes_edicion")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"estado": estado}},
	)
	return err
}

func (r SolicitudEdicionRepositoryImpl) ObtenerSolicitudPendientePorLinea(cfg config.Config, lineaID primitive.ObjectID) (*models.SolicitudEdicion, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("solicitudes_edicion")
	var solicitud models.SolicitudEdicion
	err := collection.FindOne(context.TODO(), bson.M{
		"linea_recoleccion_id": lineaID,
		"estado":               models.SolicitudPendiente,
	}).Decode(&solicitud)
	if err != nil {
		return nil, err
	}
	return &solicitud, nil
}
