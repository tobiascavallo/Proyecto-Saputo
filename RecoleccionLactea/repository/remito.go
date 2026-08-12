package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RemitoRepositoryImpl struct {
}

func (r RemitoRepositoryImpl) CrearRemito(cfg config.Config, model models.Remito) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("remitos")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}

// ObtenerRemitosFiltrados arma un filtro de Mongo dinámicamente a partir de
// los criterios que vengan seteados en RemitoFiltro (los que sean nil se
// omiten). Reemplaza los métodos puntuales por cada combinación de filtros
// — sumar un filtro nuevo (fecha, tambo) es agregar un campo al struct y un
// `if` acá, sin tocar el resto de las capas.
func (r RemitoRepositoryImpl) ObtenerRemitosFiltrados(cfg config.Config, filtro models.RemitoFiltro) ([]models.Remito, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("remitos")

	query := bson.M{}
	if filtro.CamioneroID != nil {
		query["camionero_id"] = *filtro.CamioneroID
	}
	if filtro.Estado != nil {
		query["estado_remito"] = *filtro.Estado
	}

	cursor, err := collection.Find(context.TODO(), query)
	if err != nil {
		return nil, err
	}
	var remitos []models.Remito
	err = cursor.All(context.TODO(), &remitos)
	return remitos, err
}

func (r RemitoRepositoryImpl) ObtenerRemitoPorID(cfg config.Config, ID primitive.ObjectID) (*models.Remito, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("remitos")
	var remito models.Remito
	err := collection.FindOne(context.TODO(), bson.M{"_id": ID}).Decode(&remito)
	if err != nil {
		return nil, err
	}
	return &remito, nil
}

func (r RemitoRepositoryImpl) ActualizarEstadoSincronizacion(cfg config.Config, id primitive.ObjectID, estado models.EstadoSincronizacion) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("remitos")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"estado_sincronizacion": estado}},
	)
	return err
}

func (r RemitoRepositoryImpl) ActualizarEstadoRemito(cfg config.Config, id primitive.ObjectID, estado models.EstadoRemito) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("remitos")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"estado_remito": estado}},
	)
	return err
}
