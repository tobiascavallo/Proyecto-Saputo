package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
)

type UsuarioRepositoryImpl struct {
}

func (r UsuarioRepositoryImpl) CrearUsuario(cfg config.Config, model models.Usuario) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("Usuario")
	_, err := collection.InsertOne(context.TODO(), model)
	return err
}
