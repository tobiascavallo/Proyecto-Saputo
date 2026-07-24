package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
)

// ResultadoSAPRepositoryImpl consulta la colección sap_resultados que simula SAP.
type ResultadoSAPRepositoryImpl struct{}

func (r ResultadoSAPRepositoryImpl) ObtenerResultadoPorCodigo(cfg config.Config, codigo string) (*models.ResultadoSAP, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("sap_resultados")
	var resultado models.ResultadoSAP
	err := collection.FindOne(context.TODO(), bson.M{"codigo_muestra": codigo}).Decode(&resultado)
	if err != nil {
		return nil, err
	}
	return &resultado, nil
}
