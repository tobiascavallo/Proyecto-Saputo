package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TamboRepositoryImpl struct{}

func (r TamboRepositoryImpl) CrearTambo(cfg config.Config, model models.Tambo) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambo")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}

func (r TamboRepositoryImpl) ObtenerTambos(cfg config.Config) ([]models.Tambo, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambo")
	cursor, err := collection.Find(context.TODO(), bson.M{"activo": true})
	if err != nil {
		return nil, err
	}
	var tambos []models.Tambo
	err = cursor.All(context.TODO(), &tambos)
	return tambos, err
}

func (r TamboRepositoryImpl) ObtenerTamboPorID(cfg config.Config, id primitive.ObjectID) (*models.Tambo, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambo")
	var tambo models.Tambo
	err := collection.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&tambo)
	if err != nil {
		return nil, err
	}
	return &tambo, nil
}

func (r TamboRepositoryImpl) ObtenerTambosPorTambero(cfg config.Config, tamberoID primitive.ObjectID) ([]models.Tambo, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambo")

	// Buscamos los tambos activos que pertenezcan al tamberoID provisto
	filter := bson.M{
		"tambero_id": tamberoID,
		"activo":     true,
	}

	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO()) // Buena práctica para liberar recursos del cursor

	var tambos []models.Tambo
	if err = cursor.All(context.TODO(), &tambos); err != nil {
		return nil, err
	}

	return tambos, nil
}

func (r TamboRepositoryImpl) ObtenerTamboPorNumeroTambo(cfg config.Config, numero int) (*models.Tambo, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambo")
	var tambo models.Tambo

	// revisar si se quiere o no filtrar por campo activo
	filter := bson.M{
		"numero_tambo": numero,
		"activo":       true,
	}

	err := collection.FindOne(context.TODO(), filter).Decode(&tambo)
	if err != nil {
		return nil, err
	}
	return &tambo, nil
}

func (r TamboRepositoryImpl) ActualizarTambo(cfg config.Config, id primitive.ObjectID, model models.Tambo) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambo")

	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": model},
	)
	return err
}

func (r TamboRepositoryImpl) DesactivarTambo(cfg config.Config, id primitive.ObjectID) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("tambo")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"activo": false}},
	)
	return err
}
