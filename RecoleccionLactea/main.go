package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
	"github.com/tobiascavallo/RecoleccionLactea/handlers"
	"github.com/tobiascavallo/RecoleccionLactea/middleware"
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

	usuarioRepo := repository.UsuarioRepositoryImpl{}
	authRepo := repository.AuthRepositoryImpl{}
	authService := services.NewAuthService(authRepo, usuarioRepo, cfg)
	authHandler := handlers.NewAuthHandler(authService)

	r.POST("/api/v1/auth/login", authHandler.Login)
	r.POST("/api/v1/auth/refresh", authHandler.Refresh)
	r.POST("/api/v1/auth/logout", authHandler.Logout)

	usuarioService := services.NewUsuarioService(usuarioRepo, cfg)
	usuarioHandler := handlers.NewUsuarioHandler(usuarioService)

	usuario := r.Group("/api/v1/usuario")
	usuario.Use(middleware.AuthMiddleware())
	{
		usuario.POST("", middleware.RequiereRol("encargado"), usuarioHandler.CrearUsuario)
		usuario.GET("", middleware.RequiereRol("encargado"), usuarioHandler.ObtenerUsuarios)
		usuario.GET("/:id", middleware.RequiereRol("encargado"), usuarioHandler.ObtenerUsuarioPorID)
		usuario.PUT("/:id", middleware.RequiereRol("encargado"), usuarioHandler.ActualizarUsuario)
		usuario.DELETE("/:id", middleware.RequiereRol("encargado"), usuarioHandler.DesactivarUsuario)
	}

	empresaRepo := repository.EmpresaTransportistaRepositoryImpl{}
	empresaService := services.NewEmpresaTransportistaService(empresaRepo, cfg)
	empresaHandler := handlers.NewEmpresaTransportistaHandler(empresaService)

	empresa := r.Group("/api/v1/empresaTransportista")
	empresa.Use(middleware.AuthMiddleware())
	{
		empresa.POST("", middleware.RequiereRol("encargado"), empresaHandler.CrearEmpresaTransportista)
		empresa.GET("", empresaHandler.ObtenerEmpresasTransportistas)
		empresa.GET("/:id", empresaHandler.ObtenerEmpresaTransportistaPorId)
		empresa.PUT("/:id", middleware.RequiereRol("encargado"), empresaHandler.ActualizarEmpresaTransportista)
		empresa.DELETE("/:id", middleware.RequiereRol("encargado"), empresaHandler.DesactivarEmpresaTransportista)
	}

	vehiculoRepo := repository.VehiculoRepositoryImpl{}
	vehiculoService := services.NewVehiculoService(vehiculoRepo, cfg, empresaRepo)
	vehiculoHandler := handlers.NewVehiculoHandler(vehiculoService)

	vehiculo := r.Group("/api/v1/vehiculo")
	vehiculo.Use(middleware.AuthMiddleware())
	{
		vehiculo.POST("", middleware.RequiereRol("encargado"), vehiculoHandler.CrearVehiculo)
		vehiculo.GET("", vehiculoHandler.ObtenerVehiculos)
		vehiculo.GET("/:id", vehiculoHandler.ObtenerVehiculoPorID)
		vehiculo.PUT("/:id", middleware.RequiereRol("encargado"), vehiculoHandler.ActualizarVehiculo)
		vehiculo.DELETE("/:id", middleware.RequiereRol("encargado"), vehiculoHandler.DesactivarVehiculo)
		vehiculo.GET("/empresaTransportista/:id", vehiculoHandler.ObtenerVehiculosPorEmpresa)
	}

	r.Run(":" + cfg.Port)

}
