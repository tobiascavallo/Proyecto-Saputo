package repository

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AuthRepositoryImpl struct {
	usuarioRepo UsuarioRepositoryImpl
}

// Se recibe cfg config.Config en lugar de hardcodear el nombre de la base de datos,
// para que el repository sea flexible entre entornos (desarrollo, producción, testing)
// sin necesidad de modificar el código.
func (r AuthRepositoryImpl) GuardarRefreshToken(cfg config.Config, token models.RefreshToken) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("refresh_tokens")
	_, err := collection.InsertOne(context.TODO(), token)
	return err
}

func (r AuthRepositoryImpl) ObtenerRefreshToken(cfg config.Config, token string) (*models.RefreshToken, error) {
	collection := db.DB.Database(cfg.MongoDB).Collection("refresh_tokens")
	var refreshToken models.RefreshToken
	err := collection.FindOne(context.TODO(), bson.M{"token": token}).Decode(&refreshToken)
	if err != nil {
		return nil, err
	}
	return &refreshToken, nil
}

func (r AuthRepositoryImpl) InvalidarRefreshTokensDeUsuario(cfg config.Config, usuarioID primitive.ObjectID) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("refresh_tokens")
	_, err := collection.UpdateMany(
		context.TODO(),
		bson.M{"usuario_id": usuarioID},
		bson.M{"$set": bson.M{"activo": false}},
	)
	return err
}

func (r AuthRepositoryImpl) InvalidarRefreshToken(cfg config.Config, token string) error {
	collection := db.DB.Database(cfg.MongoDB).Collection("refresh_tokens")
	_, err := collection.UpdateOne(
		context.TODO(),
		bson.M{"token": token},
		bson.M{"$set": bson.M{"activo": false}},
	)
	return err
}
