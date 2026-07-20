package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AcopladoRepositoryImpl struct {
}

func (r AcopladoRepositoryImpl) CrearAcoplado(cfg config.Config, model models.Acoplado) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("acoplados")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}

func (r AcopladoRepositoryImpl) ObtenerAcoplado(cfg config.Config) ([]models.Acoplado, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("acoplados")
	cursor, err := collection.Find(context.TODO(), bson.M{"activo": true})
	if err != nil {
		return nil, err
	}
	var acoplados []models.Acoplado
	err = cursor.All(context.TODO(), &acoplados)
	return acoplados, err
}

func (r AcopladoRepositoryImpl) ObtenerAcopladoPorID(cfg config.Config, ID primitive.ObjectID) (*models.Acoplado, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("acoplados")
	var acoplado models.Acoplado
	err := collection.FindOne(context.TODO(), bson.M{"_id": ID}).Decode(&acoplado)
	if err != nil {
		return nil, err
	}
	return &acoplado, nil
}

func (r AcopladoRepositoryImpl) ActualizarAcoplado(cfg config.Config, id primitive.ObjectID, model models.Acoplado) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("acoplados")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": model},
	)
	return err
}

func (r AcopladoRepositoryImpl) DesactivarAcoplado(cfg config.Config, id primitive.ObjectID) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("acoplados")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"activo": false}},
	)
	return err
}

func (r AcopladoRepositoryImpl) ObtenerAcopladosPorEmpresa(cfg config.Config, empresaID primitive.ObjectID) ([]models.Acoplado, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("acoplados")
	cursor, err := collection.Find(context.TODO(), bson.M{"empresa_transportista_id": empresaID, "activo": true})
	if err != nil {
		return nil, err
	}
	var acoplados []models.Acoplado
	err = cursor.All(context.TODO(), &acoplados)
	return acoplados, err
}

func (r AcopladoRepositoryImpl) ObtenerAcopladosPorPatente(cfg config.Config, patente string) (*models.Acoplado, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("acoplados")
	var acoplado models.Acoplado
	err := collection.FindOne(context.TODO(), bson.M{"patente": patente}).Decode(&acoplado)
	if err != nil {
		return nil, err
	}
	return &acoplado, nil
}
