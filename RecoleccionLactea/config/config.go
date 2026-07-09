package config

import (
	"errors"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI  string
	MongoDB   string
	JwtSecret string
	Port      string
}

// config.go - Carga las variables de entorno desde el archivo .env
// y las expone como una estructura de datos para todo el proyecto.
// Si alguna variable obligatoria no está definida, retorna un error.
func LoadConfig() (Config, error) {
	err := godotenv.Load() //godotenv carga las variables del .env como variables de entorno en el sistema operativo
	if err != nil {
		return Config{}, err
	}

	if os.Getenv("MONGO_URI") == "" { //os.Getenv busca las variables del entorno
		return Config{}, errors.New("Mongo_URI no esta disponible")
	}
	if os.Getenv("MONGO_DB") == "" {
		return Config{}, errors.New("MONGO_DB no esta disponible")
	}
	if os.Getenv("JWT_SECRET") == "" {
		return Config{}, errors.New("JWT_SECRET no esta disponible")
	}
	if os.Getenv("PORT") == "" {
		return Config{}, errors.New("PORT no esta disponible")
	}

	return Config{MongoURI: os.Getenv("MONGO_URI"),
		MongoDB:   os.Getenv("MONGO_DB"),
		JwtSecret: os.Getenv("JWT_SECRET"),
		Port:      os.Getenv("PORT")}, nil
}
