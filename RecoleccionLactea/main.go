package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/handlers"
	"github.com/tobiascavallo/RecoleccionLactea/repository"
	"github.com/tobiascavallo/RecoleccionLactea/services"
)

func main() {

	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Connect(cfg)
	if err != nil {
		log.Fatal(err)
	}

	r := gin.Default()
	r.Run(":" + cfg.Port)

	authRepo := repository.AuthRepositoryImpl{}
	authService := services.NewAuthService(authRepo, cfg)
	authHandler := handlers.NewAuthHandler(authService)

	r.POST("/api/v1/auth/login", authHandler.Login)
}
