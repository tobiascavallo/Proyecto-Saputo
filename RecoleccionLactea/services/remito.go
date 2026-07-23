package services

import (
	"errors"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RemitoRepository interface {
	CrearRemito(cfg config.Config, model models.Remito) error
	ObtenerRemitos(cfg config.Config) ([]models.Remito, error)
	ObtenerRemitoPorID(cfg config.Config, ID primitive.ObjectID) (*models.Remito, error)
	ObtenerRemitoPorCamionero(cfg config.Config, camioneroID primitive.ObjectID) ([]models.Remito, error)
	ObtenerRemitosPorEstado(cfg config.Config, camioneroID primitive.ObjectID, estado models.EstadoRemito) ([]models.Remito, error)
	ActualizarEstadoSincronizacion(cfg config.Config, id primitive.ObjectID, estado models.EstadoSincronizacion) error
	ActualizarEstadoRemito(cfg config.Config, id primitive.ObjectID, estado models.EstadoRemito) error
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
}

func NewRemitoService(
	repo RemitoRepository,
	vehiculoRepo VehiculoRepositoryParaRemito,
	acopladoRepo AcopladoRepositoryParaRemito,
	empresaRepo EmpresaRepositoryParaRemito,
	cfg config.Config,
) RemitoService {
	return RemitoService{
		repo:         repo,
		vehiculoRepo: vehiculoRepo,
		acopladoRepo: acopladoRepo,
		empresaRepo:  empresaRepo,
		cfg:          cfg,
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
	}
	if model.CreadoOffline {
		model.EstadoSincronizacion = models.EstadoPendiente
	} else {
		model.EstadoSincronizacion = models.EstadoSincronizado
	}
	model.EstadoRemito = models.EstadoRemitoEnCurso
	return s.repo.CrearRemito(s.cfg, model)
}

func (s RemitoService) ObtenerRemitos(rolUsuario string, camioneroID primitive.ObjectID) ([]models.Remito, error) {
	if rolUsuario == string(models.RolCamionero) {
		return s.repo.ObtenerRemitoPorCamionero(s.cfg, camioneroID)
	}
	return s.repo.ObtenerRemitos(s.cfg)
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
	return s.repo.ObtenerRemitosPorEstado(s.cfg, camioneroID, estado)
}

func (s RemitoService) FinalizarRemito(id primitive.ObjectID) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	_, err := s.repo.ObtenerRemitoPorID(s.cfg, id)
	if err != nil {
		return errors.New("remito no encontrado")
	}
	return s.repo.ActualizarEstadoRemito(s.cfg, id, models.EstadoRemitoFinalizado)
}

func (s RemitoService) SincronizarRemito(id primitive.ObjectID) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	_, err := s.repo.ObtenerRemitoPorID(s.cfg, id)
	if err != nil {
		return errors.New("remito no encontrado")
	}
	return s.repo.ActualizarEstadoSincronizacion(s.cfg, id, models.EstadoSincronizado)
}
