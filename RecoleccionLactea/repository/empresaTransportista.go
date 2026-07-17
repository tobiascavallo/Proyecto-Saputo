package repository

import (
	"context"
	"fmt"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EmpresaTransportistaRepositoryImpl struct{}

func (r EmpresaTransportistaRepositoryImpl) CrearEmpresaTransportista(cfg config.Config, model models.EmpresaTransportista) error { //devolver error + resultado de mongo para ver hacer logica en service
	collection := db.DB.Database(cfg.MongoDB).Collection("empresas_transportistas")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}

func (r EmpresaTransportistaRepositoryImpl) ObtenerEmpresaTransportistaPorId(cfg config.Config, id primitive.ObjectID) (models.EmpresaTransportista, error) {
    collection := db.DB.Database(cfg.MongoDB).Collection("empresas_transportistas")
    
    var empresaTransportista models.EmpresaTransportista
    err := collection.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&empresaTransportista)
    if err != nil {
        return models.EmpresaTransportista{}, err
    }

    return empresaTransportista, nil
}

func (r EmpresaTransportistaRepositoryImpl) ObtenerEmpresasTransportistas(cfg config.Config) ([]models.EmpresaTransportista, error) {
    collection := db.DB.Database(cfg.MongoDB).Collection("empresas_transportistas")
    
    cursor, err := collection.Find(context.TODO(), bson.M{"activo": true})
    if err != nil {
        return nil, err
    }
    var empresas []models.EmpresaTransportista
    err = cursor.All(context.TODO(), &empresas)
    return empresas, err
}

func (r EmpresaTransportistaRepositoryImpl) ActualizarEmpresaTransportista(cfg config.Config, id primitive.ObjectID, model models.EmpresaTransportista) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("empresas_transportistas")

	entity := bson.M{"$set": bson.M{
		"nombre":    model.Nombre,
		"cuit":      model.Cuit,
		"domicilio": model.Domicilio,
	}}
	result, err := collection.UpdateOne(context.TODO(), bson.M{"_id": id}, entity)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return fmt.Errorf("no se encontró ninguna empresa transportista con id %s", id.Hex())
	}
	return nil
}

func (r EmpresaTransportistaRepositoryImpl) DesactivarEmpresaTransportista(cfg config.Config, id primitive.ObjectID) error {
    collection := db.DB.Database(cfg.MongoDB).Collection("empresas_transportistas")

    result, err := collection.UpdateOne(context.TODO(), bson.M{"_id": id}, bson.M{"$set": bson.M{"activo": false}})
    if err != nil {
        return err
    }
    if result.MatchedCount == 0 {
        return fmt.Errorf("no se encontró ninguna empresa transportista con id %s", id.Hex())
    }
    return nil
}