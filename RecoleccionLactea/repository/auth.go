package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
)

type AuthRepositoryImpl struct{}

// Se recibe cfg config.Config en lugar de hardcodear el nombre de la base de datos,
// para que el repository sea flexible entre entornos (desarrollo, producción, testing)
// sin necesidad de modificar el código.
func (r AuthRepositoryImpl) ObtenerUsuarioPorEmail(cfg config.Config, email string) (*models.Usuario, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("usuarios")
	var usuario models.Usuario
	err := collection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&usuario)
	if err != nil {
		return nil, err
	}
	return &usuario, nil
}
