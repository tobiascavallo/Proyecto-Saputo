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

	acopladoRepo := repository.AcopladoRepositoryImpl{}
	acopladoService := services.NewAcopladoService(acopladoRepo, empresaRepo, cfg)
	acopladoHandler := handlers.NewAcopladoHandler(acopladoService)

	acoplado := r.Group("/api/v1/acoplado")
	acoplado.Use(middleware.AuthMiddleware())
	{
		acoplado.POST("", middleware.RequiereRol("encargado"), acopladoHandler.CrearAcoplado)
		acoplado.GET("", acopladoHandler.ObtenerAcoplados)
		acoplado.GET("/:id", acopladoHandler.ObtenerAcopladoPorID)
		acoplado.PUT("/:id", middleware.RequiereRol("encargado"), acopladoHandler.ActualizarAcoplado)
		acoplado.DELETE("/:id", middleware.RequiereRol("encargado"), acopladoHandler.DesactivarAcoplado)
		acoplado.GET("/empresaTransportista/:id", acopladoHandler.ObtenerAcopladosPorEmpresa)
	}

	tamberoRepo := repository.TamberoRepositoryImpl{}
	tamberoService := services.NewTamberoService(tamberoRepo, cfg)
	tamberoHandler := handlers.NewTamberoHandler(tamberoService)

	tambero := r.Group("/api/v1/tambero")
	tambero.Use(middleware.AuthMiddleware())
	{
		tambero.POST("", middleware.RequiereRol("encargado"), tamberoHandler.CrearTambero)
		tambero.GET("", tamberoHandler.ObtenerTamberos)
		tambero.GET("/:id", tamberoHandler.ObtenerTamberoPorID)
		tambero.GET("/email/:email", tamberoHandler.ObtenerTamberoPorEmail)
		tambero.GET("/cuit/:cuit", tamberoHandler.ObtenerTamberoPorCuit)
		tambero.GET("/telefono/:telefono", tamberoHandler.ObtenerTamberoPorTelefono)
		tambero.PATCH("/:id", middleware.RequiereRol("encargado"), tamberoHandler.ActualizarTambero)
		tambero.DELETE("/:id", middleware.RequiereRol("encargado"), tamberoHandler.DesactivarTambero)
	}

	tamboRepo := repository.TamboRepositoryImpl{}
	tamboService := services.NewTamboService(tamboRepo, tamberoRepo, cfg)
	tamboHandler := handlers.NewTamboHandler(tamboService)

	tambo := r.Group("/api/v1/tambo")
	tambo.Use(middleware.AuthMiddleware())
	{
		tambo.POST("", middleware.RequiereRol("encargado"), tamboHandler.CrearTambo)
		tambo.GET("", tamboHandler.ObtenerTambos)
		tambo.GET("/:id", tamboHandler.ObtenerTamboPorID)
		tambo.GET("/numero/:numero", tamboHandler.ObtenerTamboPorNumeroTambo)
		tambo.GET("/tambero/:tamberoId", tamboHandler.ObtenerTambosPorTambero)
		tambo.PATCH("/:id", middleware.RequiereRol("encargado"), tamboHandler.ActualizarTambo)
		tambo.DELETE("/:id", middleware.RequiereRol("encargado"), tamboHandler.DesactivarTambo)
	}

	remitoRepo := repository.RemitoRepositoryImpl{}
	remitoService := services.NewRemitoService(remitoRepo, vehiculoRepo, acopladoRepo, empresaRepo, cfg)
	remitoHandler := handlers.NewRemitoHandler(remitoService)

	remito := r.Group("/api/v1/remito")
	remito.Use(middleware.AuthMiddleware())
	{
		{
			remito.POST("", middleware.RequiereRol("camionero"), remitoHandler.CrearRemito)
			remito.GET("", remitoHandler.ObtenerRemitos)
			remito.GET("/estado", middleware.RequiereRol("camionero"), remitoHandler.ObtenerRemitosPorEstado)
			remito.GET("/:id", remitoHandler.ObtenerRemitoPorID)
			remito.PATCH("/:id/finalizar", middleware.RequiereRol("camionero"), remitoHandler.FinalizarRemito)
			remito.PATCH("/:id/sincronizar", remitoHandler.SincronizarRemito)
		}
	}

	lineaRepo := repository.LineaRecoleccionRepositoryImpl{}

	solicitudRepo := repository.SolicitudEdicionRepositoryImpl{}
	solicitudService := services.NewSolicitudEdicionService(solicitudRepo, lineaRepo, remitoRepo, cfg)
	solicitudHandler := handlers.NewSolicitudEdicionHandler(solicitudService)

	solicitud := r.Group("/api/v1/solicitudEdicion")
	solicitud.Use(middleware.AuthMiddleware())
	{
		solicitud.POST("", middleware.RequiereRol("camionero"), solicitudHandler.CrearSolicitud)
		solicitud.GET("", solicitudHandler.ObtenerSolicitudes)
		solicitud.GET("/:id", solicitudHandler.ObtenerSolicitudPorID)
		solicitud.PATCH("/:id/decision", middleware.RequiereRol("encargado"), solicitudHandler.TomarDecision)
	}

	lineaService := services.NewLineaRecoleccionService(lineaRepo, remitoRepo, tamboRepo, solicitudRepo, cfg)
	lineaHandler := handlers.NewLineaRecoleccionHandler(lineaService)

	linea := r.Group("/api/v1/lineaRecoleccion")
	linea.Use(middleware.AuthMiddleware())
	{
		linea.POST("", middleware.RequiereRol("camionero"), lineaHandler.CrearLineaRecoleccion)
		linea.GET("", lineaHandler.ObtenerLineas)
		linea.GET("/:id", lineaHandler.ObtenerLineaPorID)
		linea.GET("/remito/:remitoId", lineaHandler.ObtenerLineasPorRemito)
		linea.GET("/tambo/:tamboId", lineaHandler.ObtenerLineasPorTambo)
		linea.GET("/cisterna/:remitoId", lineaHandler.ObtenerLineasPorCisterna)
		linea.GET("/codigo", lineaHandler.ObtenerLineaPorCodigoMuestra)
		linea.PUT("/:id", middleware.RequiereRol("camionero"), lineaHandler.ActualizarLineaRecoleccion)
	}

	resultadoAnalisisRepo := repository.ResultadoAnalisisRepositoryImpl{}
	resultadoSAPRepo := repository.ResultadoSAPRepositoryImpl{}
	resultadoAnalisisService := services.NewResultadoAnalisisService(resultadoAnalisisRepo, resultadoSAPRepo, lineaRepo, cfg)
	resultadoAnalisisHandler := handlers.NewResultadoAnalisisHandler(resultadoAnalisisService)

	resultado := r.Group("/api/v1/resultadoAnalisis")
	resultado.Use(middleware.AuthMiddleware())
	{
		resultado.POST("/consultarSAP", middleware.RequiereRol("encargado"), resultadoAnalisisHandler.ObtenerResultadoDesdeSAP)
		resultado.GET("", resultadoAnalisisHandler.ObtenerResultados)
		resultado.GET("/:id", resultadoAnalisisHandler.ObtenerResultadoPorID)
		resultado.GET("/linea/:lineaId", resultadoAnalisisHandler.ObtenerResultadosPorLinea)
		resultado.PUT("/:id", middleware.RequiereRol("encargado"), resultadoAnalisisHandler.ActualizarResultado)
	}
	r.Run(":" + cfg.Port)
}
