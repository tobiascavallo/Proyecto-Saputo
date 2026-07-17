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

	authRepo := repository.AuthRepositoryImpl{}
	authService := services.NewAuthService(authRepo, cfg)
	authHandler := handlers.NewAuthHandler(authService)

	r.POST("/api/v1/auth/login", authHandler.Login)
	r.POST("/api/v1/auth/refresh", authHandler.Refresh)
	r.POST("/api/v1/auth/logout", authHandler.Logout)

	empresaTransportistaRepo := repository.EmpresaTransportistaRepositoryImpl{}
	empresaTransportistaService := services.NewEmpresaTransportistaService(empresaTransportistaRepo, cfg)
	empresaTransportistaHandler := handlers.NewEmpresaTransportistaHandler(empresaTransportistaService)

	r.POST("/api/v1/empresas-transportistas", empresaTransportistaHandler.CrearEmpresaTransportista)
	r.GET("/api/v1/empresas-transportistas", empresaTransportistaHandler.ObtenerEmpresasTransportistas)
	r.GET("/api/v1/empresas-transportistas/:id", empresaTransportistaHandler.ObtenerEmpresaTransportistaPorId)
	r.PATCH("/api/v1/empresas-transportistas/:id", empresaTransportistaHandler.ActualizarEmpresaTransportista)
	r.DELETE("/api/v1/empresas-transportistas/:id", empresaTransportistaHandler.EliminarEmpresaTransportista)

	r.Run(":" + cfg.Port)

}
