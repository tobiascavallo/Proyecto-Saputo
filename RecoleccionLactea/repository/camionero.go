package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CamioneroRepositoryImpl struct{}

func (r CamioneroRepositoryImpl) CrearCamionero(cfg config.Config, model models.Camionero) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("camioneros")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}

func (r CamioneroRepositoryImpl) ObtenerCamioneros(cfg config.Config) ([]models.Camionero, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("camioneros")
	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		return nil, err
	}
	var camioneros []models.Camionero
	err = cursor.All(context.TODO(), &camioneros)
	return camioneros, err
}

func (r CamioneroRepositoryImpl) ObtenerCamioneroPorID(cfg config.Config, id primitive.ObjectID) (*models.Camionero, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("camioneros")
	var camionero models.Camionero
	err := collection.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&camionero)
	if err != nil {
		return nil, err
	}
	return &camionero, nil
}

// ObtenerCamioneroPorUsuarioID solo considera registros activos: si el
// camionero fue desactivado, se lo trata como si no tuviera datos
// completados (tanto para el detalle como para la validación de unicidad al
// crear uno nuevo — reactivar equivale a completar los datos de nuevo).
func (r CamioneroRepositoryImpl) ObtenerCamioneroPorUsuarioID(cfg config.Config, usuarioID primitive.ObjectID) (*models.Camionero, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("camioneros")
	var camionero models.Camionero
	err := collection.FindOne(context.TODO(), bson.M{"usuario_id": usuarioID, "activo": true}).Decode(&camionero)
	if err != nil {
		return nil, err
	}
	return &camionero, nil
}

func (r CamioneroRepositoryImpl) ActualizarCamionero(cfg config.Config, id primitive.ObjectID, model models.Camionero) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("camioneros")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"empresa_transportista_id": model.EmpresaTransportistaID}},
	)
	return err
}

func (r CamioneroRepositoryImpl) DesactivarCamionero(cfg config.Config, id primitive.ObjectID) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("camioneros")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"activo": false}},
	)
	return err
}
