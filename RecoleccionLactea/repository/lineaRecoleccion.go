package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LineaRecoleccionRepositoryImpl struct{}

func (r LineaRecoleccionRepositoryImpl) CrearLineaRecoleccion(cfg config.Config, model models.LineaRecoleccion) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("lineas_recoleccion")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}

func (r LineaRecoleccionRepositoryImpl) ObtenerLineasPorRemito(cfg config.Config, remitoID primitive.ObjectID) ([]models.LineaRecoleccion, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("lineas_recoleccion")
	cursor, err := collection.Find(context.TODO(), bson.M{"remito_id": remitoID})
	if err != nil {
		return nil, err
	}
	var lineas []models.LineaRecoleccion
	err = cursor.All(context.TODO(), &lineas)
	return lineas, err
}

func (r LineaRecoleccionRepositoryImpl) ObtenerLineaPorID(cfg config.Config, id primitive.ObjectID) (*models.LineaRecoleccion, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("lineas_recoleccion")
	var linea models.LineaRecoleccion
	err := collection.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&linea)
	if err != nil {
		return nil, err
	}
	return &linea, nil
}

func (r LineaRecoleccionRepositoryImpl) ObtenerLineaPorCodigoMuestra(cfg config.Config, codigo string) (*models.LineaRecoleccion, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("lineas_recoleccion")
	var linea models.LineaRecoleccion
	err := collection.FindOne(context.TODO(), bson.M{
		"$or": []bson.M{
			{"codigo_muestra_diaria": codigo},
			{"codigo_muestra_ufc": codigo},
		},
	}).Decode(&linea)
	if err != nil {
		return nil, err
	}
	return &linea, nil
}

func (r LineaRecoleccionRepositoryImpl) ActualizarLineaRecoleccion(cfg config.Config, id primitive.ObjectID, model models.LineaRecoleccion) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("lineas_recoleccion")

	update := bson.M{}
	if model.LitrosRecibidos != 0 {
		update["litros_recibidos"] = model.LitrosRecibidos
	}
	if model.TemperaturaCelcius != 0 {
		update["temperatura_celcius"] = model.TemperaturaCelcius
	}
	if model.NumeroCisterna != 0 {
		update["numero_cisterna"] = model.NumeroCisterna
	}
	if !model.HoraRecoleccion.IsZero() {
		update["hora_recoleccion"] = model.HoraRecoleccion
	}
	if model.CodigoMuestraDiaria != "" {
		update["codigo_muestra_diaria"] = model.CodigoMuestraDiaria
	}
	if model.CodigoMuestraUFC != "" {
		update["codigo_muestra_ufc"] = model.CodigoMuestraUFC
	}

	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": update},
	)
	return err
}

func (r LineaRecoleccionRepositoryImpl) ObtenerLineasPorTambo(cfg config.Config, tamboID primitive.ObjectID) ([]models.LineaRecoleccion, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("lineas_recoleccion")
	cursor, err := collection.Find(context.TODO(), bson.M{"tambo_id": tamboID})
	if err != nil {
		return nil, err
	}
	var lineas []models.LineaRecoleccion
	err = cursor.All(context.TODO(), &lineas)
	return lineas, err
}

func (r LineaRecoleccionRepositoryImpl) ObtenerLineasPorCisterna(cfg config.Config, remitoID primitive.ObjectID, numeroCisterna int) ([]models.LineaRecoleccion, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("lineas_recoleccion")
	cursor, err := collection.Find(context.TODO(), bson.M{
		"remito_id":       remitoID,
		"numero_cisterna": numeroCisterna,
	})
	if err != nil {
		return nil, err
	}
	var lineas []models.LineaRecoleccion
	err = cursor.All(context.TODO(), &lineas)
	return lineas, err
}

func (r LineaRecoleccionRepositoryImpl) ObtenerLineas(cfg config.Config) ([]models.LineaRecoleccion, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("lineas_recoleccion")
	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		return nil, err
	}
	var lineas []models.LineaRecoleccion
	err = cursor.All(context.TODO(), &lineas)
	return lineas, err
}
