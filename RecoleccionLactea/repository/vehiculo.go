package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type VehiculoRepositoryImpl struct {
}

func (r VehiculoRepositoryImpl) CrearVehiculo(cfg config.Config, model models.Vehiculo) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("vehiculos")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}

func (r VehiculoRepositoryImpl) ObtenerVehiculos(cfg config.Config) ([]models.Vehiculo, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("vehiculos")
	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		return nil, err
	}
	var vehiculos []models.Vehiculo
	err = cursor.All(context.TODO(), &vehiculos)
	return vehiculos, err
}

func (r VehiculoRepositoryImpl) ObtenerVehiculosPorID(cfg config.Config, ID primitive.ObjectID) (*models.Vehiculo, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("vehiculos")
	var vehiculo models.Vehiculo
	err := collection.FindOne(context.TODO(), bson.M{"_id": ID}).Decode(&vehiculo)
	if err != nil {
		return nil, err
	}
	return &vehiculo, nil
}

func (r VehiculoRepositoryImpl) ActualizarVehiculo(cfg config.Config, id primitive.ObjectID, model models.Vehiculo) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("vehiculos")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": model},
	)
	return err
}

func (r VehiculoRepositoryImpl) DesactivarVehiculo(cfg config.Config, id primitive.ObjectID) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("vehiculos")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"activo": false}},
	)
	return err
}

func (r VehiculoRepositoryImpl) ObtenerVehiculosPorEmpresa(cfg config.Config, empresaID primitive.ObjectID) ([]models.Vehiculo, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("vehiculos")
	cursor, err := collection.Find(context.TODO(), bson.M{"empresa_transportista_id": empresaID})
	if err != nil {
		return nil, err
	}
	var vehiculos []models.Vehiculo
	err = cursor.All(context.TODO(), &vehiculos)
	return vehiculos, err
}

func (r VehiculoRepositoryImpl) ObtenerVehiculoPorPatente(cfg config.Config, patente string) (*models.Vehiculo, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("vehiculos")
	var vehiculo models.Vehiculo
	err := collection.FindOne(context.TODO(), bson.M{"patente": patente}).Decode(&vehiculo)
	if err != nil {
		return nil, err
	}
	return &vehiculo, nil
}
