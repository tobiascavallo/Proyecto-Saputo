package repository

import (
	"context"
	"fmt"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"github.com/tobiascavallo/RecoleccionLactea/utils"
	"go.mongodb.org/mongo-driver/bson"
)

type EmpresaTransportistaRepositoryImpl struct{}

func (r EmpresaTransportistaRepositoryImpl) CrearEmpresaTransportista(cfg config.Config, model models.EmpresaTransportista) error { //devolver error + resultado de mongo para ver hacer logica en service
	collection := db.DB.Database(cfg.MongoDB).Collection("EmpresaTransportista")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}

func (r EmpresaTransportistaRepositoryImpl) ObtenerEmpresaTransportistaPorId(cfg config.Config, id string) (models.EmpresaTransportista, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("EmpresaTransportista")
	objectID, err := utils.GetObjectIDFromStringID(id)
	if err != nil {
		return models.EmpresaTransportista{}, err
	}

	filter := bson.M{"_id": objectID}

	var empresaTransportista models.EmpresaTransportista
	err = collection.FindOne(context.TODO(), filter).Decode(&empresaTransportista)
	if err != nil {
		return models.EmpresaTransportista{}, err
	}

	return empresaTransportista, nil
}

func (r EmpresaTransportistaRepositoryImpl) ObtenerEmpresasTransportistas(cfg config.Config) ([]models.EmpresaTransportista, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("EmpresaTransportista")
	filter := bson.M{}

	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var empresas []models.EmpresaTransportista
	for cursor.Next(context.Background()) {
		var empresa models.EmpresaTransportista
		err := cursor.Decode(&empresa)
		if err != nil {
			return nil, err
		}
		empresas = append(empresas, empresa)
	}
	if err := cursor.Err(); err != nil {
		return nil, err
	}
	return empresas, nil
}

func (r EmpresaTransportistaRepositoryImpl) ActualizarEmpresaTransportista(cfg config.Config, id string, model models.EmpresaTransportista) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("EmpresaTransportista")
	objectID, err := utils.GetObjectIDFromStringID(id)
	if err != nil {
		return err
	}

	filter := bson.M{"_id": objectID}

	entity := bson.M{"$set": bson.M{
		"nombre":    model.Nombre,
		"cuit":      model.Cuit,
		"domicilio": model.Domicilio,
	}}
	result, err := collection.UpdateOne(context.TODO(), filter, entity)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return fmt.Errorf("no se encontró ninguna empresa transportista con id %s", id)
	}
	return nil
}

func (r EmpresaTransportistaRepositoryImpl) EliminarEmpresaTransportista(cfg config.Config, id string) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("EmpresaTransportista")
	objectID, err := utils.GetObjectIDFromStringID(id)
	if err != nil {
		return err
	}

	filter := bson.M{"_id": objectID}
	result, err := collection.DeleteOne(context.TODO(), filter)
	if err != nil {
		return err
	}
	if result.DeletedCount == 0 {
		return fmt.Errorf("no se encontró ninguna empresa transportista con id %s", id)
	}
	return nil
}