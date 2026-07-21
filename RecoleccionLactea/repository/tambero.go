package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TamberoRepositoryImpl struct{}

func (r TamberoRepositoryImpl) CrearTambero(cfg config.Config, model models.Tambero) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambero")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}

func (r TamberoRepositoryImpl) ObtenerTamberos(cfg config.Config) ([]models.Tambero, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambero")
	cursor, err := collection.Find(context.TODO(), bson.M{"activo": true})
	if err != nil {
		return nil, err
	}
	var tamberos []models.Tambero
	err = cursor.All(context.TODO(), &tamberos)
	return tamberos, err
}

func (r TamberoRepositoryImpl) ObtenerTamberoPorID(cfg config.Config, id primitive.ObjectID) (*models.Tambero, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambero")
	var tambero models.Tambero
	err := collection.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&tambero)
	if err != nil {
		return nil, err
	}
	return &tambero, nil
}

func (r TamberoRepositoryImpl) ObtenerTamberoPorCuit(cfg config.Config, cuit string) (*models.Tambero, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambero")
	var tambero models.Tambero
	err := collection.FindOne(context.TODO(), bson.M{"cuit": cuit}).Decode(&tambero)
	if err != nil {
		return nil, err
	}
	return &tambero, nil
}

func (r TamberoRepositoryImpl) ObtenerTamberoPorEmail(cfg config.Config, email string) (*models.Tambero, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambero")
	var tambero models.Tambero
	err := collection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&tambero)
	if err != nil {
		return nil, err
	}
	return &tambero, nil
}

func (r TamberoRepositoryImpl) ObtenerTamberoPorTelefono(cfg config.Config, telefono string) (*models.Tambero, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambero")
	var tambero models.Tambero
	err := collection.FindOne(context.TODO(), bson.M{"telefono": telefono}).Decode(&tambero)
	if err != nil {
		return nil, err
	}
	return &tambero, nil
}

func (r TamberoRepositoryImpl) ActualizarTambero(cfg config.Config, id primitive.ObjectID, model models.Tambero) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambero")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": model},
	)
	return err
}

func (r TamberoRepositoryImpl) DesactivarTambero(cfg config.Config, id primitive.ObjectID) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambero")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"activo": false}},
	)
	return err
}
