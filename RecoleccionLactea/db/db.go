package db

import (
	"context"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Client

// db.go - Maneja la conexión a MongoDB.
// Abre la conexión una sola vez al arrancar el servidor (patrón singleton)
// y la expone en la variable global DB para que todo el proyecto pueda usarla.
func Connect(cfg config.Config) (*mongo.Client, error) {
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(cfg.MongoURI))

	if err != nil {
		return nil, err

	}

	err = client.Ping(context.TODO(), nil)
	if err != nil {
		return nil, err
	}

	DB = client
	return client, nil
}
