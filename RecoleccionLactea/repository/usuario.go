package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UsuarioRepositoryImpl struct {
}

func (r UsuarioRepositoryImpl) CrearUsuario(cfg config.Config, model models.Usuario) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("usuarios")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}

func (r UsuarioRepositoryImpl) ObtenerUsuarios(cfg config.Config) ([]models.Usuario, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("usuarios")
	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		return nil, err
	}
	var usuarios []models.Usuario
	err = cursor.All(context.TODO(), &usuarios)
	return usuarios, err
}

func (r UsuarioRepositoryImpl) ObtenerUsuarioPorID(cfg config.Config, ID primitive.ObjectID) (*models.Usuario, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("usuarios")
	var usuario models.Usuario
	err := collection.FindOne(context.TODO(), bson.M{"_id": ID}).Decode(&usuario)
	if err != nil {
		return nil, err
	}
	return &usuario, nil
}

func (r UsuarioRepositoryImpl) ObtenerUsuarioPorEmail(cfg config.Config, email string) (*models.Usuario, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("usuarios")
	var usuario models.Usuario
	err := collection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&usuario)
	if err != nil {
		return nil, err
	}
	return &usuario, nil
}

func (r UsuarioRepositoryImpl) ActualizarUsuario(cfg config.Config, id primitive.ObjectID, model models.Usuario) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("usuarios")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": model},
	)
	return err
}

func (r UsuarioRepositoryImpl) DesactivarUsuario(cfg config.Config, id primitive.ObjectID) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("usuarios")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"activo": false}},
	)
	return err
}

// metodo para verificar que el sistema no quede sin encargados activos("eliminados") porque sino nadie podria administrar el mismo.
func (r UsuarioRepositoryImpl) ContarEncargadosActivos(cfg config.Config) (int64, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("usuarios")
	count, err := collection.CountDocuments(context.TODO(), bson.M{"rol": "encargado", "activo": true})
	return count, err
}
