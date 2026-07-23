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

func (r RemitoRepositoryImpl) ObtenerRemitos(cfg config.Config) ([]models.Remito, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("remitos")
	cursor, err := collection.Find(context.TODO(), bson.M{})
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

func (r RemitoRepositoryImpl) ObtenerRemitoPorCamionero(cfg config.Config, camioneroID primitive.ObjectID) ([]models.Remito, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("remitos")
	filter := bson.M{
		"camionero_id": camioneroID,
	}
	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}
	var remitos []models.Remito
	if err = cursor.All(context.TODO(), &remitos); err != nil {
		return nil, err
	}

	return remitos, err
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

func (r RemitoRepositoryImpl) ObtenerRemitosPorEstado(cfg config.Config, camioneroID primitive.ObjectID, estado models.EstadoRemito) ([]models.Remito, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("remitos")
	cursor, err := collection.Find(context.TODO(), bson.M{
		"camionero_id":  camioneroID,
		"estado_remito": estado,
	})
	if err != nil {
		return nil, err
	}
	var remitos []models.Remito
	err = cursor.All(context.TODO(), &remitos)
	return remitos, err
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
