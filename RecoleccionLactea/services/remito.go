package services

import (
	"errors"
	"fmt"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RemitoRepository interface {
	CrearRemito(cfg config.Config, model models.Remito) error
	ObtenerRemitosFiltrados(cfg config.Config, filtro models.RemitoFiltro) ([]models.Remito, error)
	ObtenerRemitoPorID(cfg config.Config, ID primitive.ObjectID) (*models.Remito, error)
	ObtenerNumeroRemitoMaximo(cfg config.Config) (int, error)
	ActualizarEstadoSincronizacion(cfg config.Config, id primitive.ObjectID, estado models.EstadoSincronizacion) error
	ActualizarEstadoRemito(cfg config.Config, id primitive.ObjectID, estado models.EstadoRemito) error
}

// tipoAcopladoCompatible define qué tipo de acoplado puede enganchar cada
// tipo de vehículo: un camión lleva un acoplado con ejes propios (enganche
// por lanza); un tractor solo lleva un semirremolque, que se apoya sobre el
// tractor en vez de tener ejes propios.
var tipoAcopladoCompatible = map[models.TipoVehiculo]models.TipoAcoplado{
	models.Camion:              models.AcopladoSimple,
	models.TractorSemiRemolque: models.Semirremolque,
}

type VehiculoRepositoryParaRemito interface {
	ObtenerVehiculosPorID(cfg config.Config, ID primitive.ObjectID) (*models.Vehiculo, error)
}

type AcopladoRepositoryParaRemito interface {
	ObtenerAcopladoPorID(cfg config.Config, ID primitive.ObjectID) (*models.Acoplado, error)
}

type EmpresaRepositoryParaRemito interface {
	ObtenerEmpresaTransportistaPorId(cfg config.Config, id primitive.ObjectID) (models.EmpresaTransportista, error)
}

type RemitoService struct {
	repo         RemitoRepository
	vehiculoRepo VehiculoRepositoryParaRemito
	acopladoRepo AcopladoRepositoryParaRemito
	empresaRepo  EmpresaRepositoryParaRemito
	cfg          config.Config
	lineaService LineaRecoleccionRepository
	hub          NotificadorSSE
}

func NewRemitoService(
	repo RemitoRepository,
	vehiculoRepo VehiculoRepositoryParaRemito,
	acopladoRepo AcopladoRepositoryParaRemito,
	empresaRepo EmpresaRepositoryParaRemito,
	cfg config.Config,
	lineaService LineaRecoleccionRepository,
	hub NotificadorSSE,
) RemitoService {
	return RemitoService{
		repo:         repo,
		vehiculoRepo: vehiculoRepo,
		acopladoRepo: acopladoRepo,
		empresaRepo:  empresaRepo,
		cfg:          cfg,
		lineaService: lineaService,
		hub:          hub,
	}
}

func (s RemitoService) CrearRemito(model models.Remito) error {
	if model.CamioneroID.IsZero() {
		return errors.New("camionero requerido")
	}
	vehiculo, _ := s.vehiculoRepo.ObtenerVehiculosPorID(s.cfg, model.VehiculoID)
	if vehiculo == nil {
		return errors.New("vehiculo inexistente")
	}
	_, err := s.empresaRepo.ObtenerEmpresaTransportistaPorId(s.cfg, model.EmpresaTransportistaID)
	if err != nil {
		return errors.New("la empresa transportista no existe")
	}

	if !model.AcopladoID.IsZero() {
		acoplado, _ := s.acopladoRepo.ObtenerAcopladoPorID(s.cfg, model.AcopladoID)
		if acoplado == nil {
			return errors.New("el acoplado no existe")
		}
		tipoRequerido, ok := tipoAcopladoCompatible[vehiculo.Tipo]
		if !ok || acoplado.Tipo != tipoRequerido {
			return fmt.Errorf("un vehículo tipo %q no admite un acoplado tipo %q", vehiculo.Tipo, acoplado.Tipo)
		}
	}

	// Un camionero solo puede tener un remito en curso a la vez — evita que
	// un doble tap o un reintento de red genere dos viajes simultáneos. Es
	// un chequeo a nivel aplicación (mismo criterio que el resto de las
	// validaciones de unicidad del proyecto), no un índice único de Mongo.
	enCurso := models.EstadoRemitoEnCurso
	remitosEnCurso, err := s.repo.ObtenerRemitosFiltrados(s.cfg, models.RemitoFiltro{
		CamioneroID: &model.CamioneroID,
		Estado:      &enCurso,
	})
	if err != nil {
		return err
	}
	if len(remitosEnCurso) > 0 {
		return errors.New("ya tenés un remito en curso — finalizalo antes de iniciar otro")
	}

	// numero_remito es autoincremental y global (no por camionero) — sigue
	// la numeración del talonario físico que reemplaza.
	numeroMaximo, err := s.repo.ObtenerNumeroRemitoMaximo(s.cfg)
	if err != nil {
		return err
	}
	model.NumeroRemito = numeroMaximo + 1

	if model.CreadoOffline {
		model.EstadoSincronizacion = models.EstadoPendiente
	} else {
		model.EstadoSincronizacion = models.EstadoSincronizado
	}
	model.EstadoRemito = models.EstadoRemitoEnCurso
	return s.repo.CrearRemito(s.cfg, model)
}

// ObtenerRemitos devuelve remitos según el rol de quien pregunta.
//   - Camionero: solo ve SUS remitos — camioneroIDToken se fuerza como filtro
//     sin importar qué venga en camioneroIDFiltro, para que no pueda espiar
//     remitos de otro camionero pasando su ID por query param.
//   - Encargado/empleado: camioneroIDFiltro se aplica libremente si vino
//     (para acotar a un camionero puntual), o no se filtra si vino vacío.
//
// El filtro por estado es opcional en ambos casos: si "estado" viene vacío, no se aplica.
func (s RemitoService) ObtenerRemitos(rolUsuario string, camioneroIDToken primitive.ObjectID, estado string, camioneroIDFiltro string) ([]models.Remito, error) {
	filtro := models.RemitoFiltro{}

	if estado != "" {
		e := models.EstadoRemito(estado)
		filtro.Estado = &e
	}

	if rolUsuario == string(models.RolCamionero) {
		filtro.CamioneroID = &camioneroIDToken
	} else if camioneroIDFiltro != "" {
		id, err := primitive.ObjectIDFromHex(camioneroIDFiltro)
		if err != nil {
			return nil, errors.New("camionero_id inválido")
		}
		filtro.CamioneroID = &id
	}

	return s.repo.ObtenerRemitosFiltrados(s.cfg, filtro)
}

func (s RemitoService) ObtenerRemitoPorID(id primitive.ObjectID, rolUsuario string, camioneroID primitive.ObjectID) (*models.Remito, error) {
	if id.IsZero() {
		return nil, errors.New("ID inválido")
	}
	remito, err := s.repo.ObtenerRemitoPorID(s.cfg, id)
	if err != nil {
		return nil, errors.New("remito no encontrado")
	}
	if rolUsuario == string(models.RolCamionero) && remito.CamioneroID != camioneroID {
		return nil, errors.New("no tenés permiso para ver este remito")
	}
	return remito, nil
}

func (s RemitoService) ObtenerRemitosPorEstado(camioneroID primitive.ObjectID, estado models.EstadoRemito) ([]models.Remito, error) {
	if camioneroID.IsZero() {
		return nil, errors.New("ID de camionero inválido")
	}
	return s.repo.ObtenerRemitosFiltrados(s.cfg, models.RemitoFiltro{
		CamioneroID: &camioneroID,
		Estado:      &estado,
	})
}

func (s RemitoService) FinalizarRemito(id primitive.ObjectID) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	_, err := s.repo.ObtenerRemitoPorID(s.cfg, id)
	if err != nil {
		return errors.New("remito no encontrado")
	}

	lineas, err := s.lineaService.ObtenerLineasPorRemito(s.cfg, id)

	if err != nil {
		return errors.New("error al verificar lineas de remito")
	}

	if len(lineas) == 0 {
		return errors.New("Error al finalizar remito por falta de lineas de recoleccion")

	}
	if err := s.repo.ActualizarEstadoRemito(s.cfg, id, models.EstadoRemitoFinalizado); err != nil {
		return err
	}

	if s.hub != nil {
		s.hub.Notificar("remito_finalizado", map[string]string{"remitoId": id.Hex()})
	}
	return nil
}

func (s RemitoService) SincronizarRemito(id primitive.ObjectID) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	_, err := s.repo.ObtenerRemitoPorID(s.cfg, id)
	if err != nil {
		return errors.New("remito no encontrado")
	}
	if err := s.repo.ActualizarEstadoSincronizacion(s.cfg, id, models.EstadoSincronizado); err != nil {
		return err
	}

	if s.hub != nil {
		s.hub.Notificar("remito_sincronizado", map[string]string{"remitoId": id.Hex()})
	}
	return nil
}
