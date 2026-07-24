package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ResultadoAnalisisRepositoryImpl struct{}

func (r ResultadoAnalisisRepositoryImpl) CrearResultadoAnalisis(cfg config.Config, model models.ResultadoAnalisis) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("resultados_analisis")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}

func (r ResultadoAnalisisRepositoryImpl) ObtenerResultados(cfg config.Config) ([]models.ResultadoAnalisis, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("resultados_analisis")
	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		return nil, err
	}
	var resultados []models.ResultadoAnalisis
	err = cursor.All(context.TODO(), &resultados)
	return resultados, err
}

func (r ResultadoAnalisisRepositoryImpl) ObtenerResultadoPorID(cfg config.Config, id primitive.ObjectID) (*models.ResultadoAnalisis, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("resultados_analisis")
	var resultado models.ResultadoAnalisis
	err := collection.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&resultado)
	if err != nil {
		return nil, err
	}
	return &resultado, nil
}

func (r ResultadoAnalisisRepositoryImpl) ObtenerResultadosPorLinea(cfg config.Config, lineaID primitive.ObjectID) ([]models.ResultadoAnalisis, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("resultados_analisis")
	cursor, err := collection.Find(context.TODO(), bson.M{"linea_recoleccion_id": lineaID})
	if err != nil {
		return nil, err
	}
	var resultados []models.ResultadoAnalisis
	err = cursor.All(context.TODO(), &resultados)
	return resultados, err
}

func (r ResultadoAnalisisRepositoryImpl) ObtenerResultadosPorEstado(cfg config.Config, estado models.Resultado) ([]models.ResultadoAnalisis, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("resultados_analisis")
	cursor, err := collection.Find(context.TODO(), bson.M{"resultado": estado})
	if err != nil {
		return nil, err
	}
	var resultados []models.ResultadoAnalisis
	err = cursor.All(context.TODO(), &resultados)
	return resultados, err
}

func (r ResultadoAnalisisRepositoryImpl) ObtenerResultadoPorLineaYTipo(cfg config.Config, lineaID primitive.ObjectID, tipo models.TipoMuestra) (*models.ResultadoAnalisis, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("resultados_analisis")
	var resultado models.ResultadoAnalisis
	err := collection.FindOne(context.TODO(), bson.M{
		"linea_recoleccion_id": lineaID,
		"tipo_muestra":         tipo,
	}).Decode(&resultado)
	if err != nil {
		return nil, err
	}
	return &resultado, nil
}

func (r ResultadoAnalisisRepositoryImpl) ActualizarResultado(cfg config.Config, id primitive.ObjectID, model models.ResultadoAnalisis) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("resultados_analisis")
	update := bson.M{}
	if model.Resultado != "" {
		update["resultado"] = model.Resultado
	}
	if model.Observaciones != "" {
		update["observaciones"] = model.Observaciones
	}
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": update},
	)
	return err
}
