package services

import (
	"errors"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SolicitudEdicionRepository interface {
	CrearSolicitud(cfg config.Config, model models.SolicitudEdicion) error
	ObtenerSolicitudes(cfg config.Config) ([]models.SolicitudEdicion, error)
	ObtenerSolicitudPorID(cfg config.Config, id primitive.ObjectID) (*models.SolicitudEdicion, error)
	ObtenerSolicitudesPorCamionero(cfg config.Config, camioneroID primitive.ObjectID) ([]models.SolicitudEdicion, error)
	ObtenerSolicitudAprobadaPorLinea(cfg config.Config, lineaID primitive.ObjectID) (*models.SolicitudEdicion, error)
	ActualizarEstadoSolicitud(cfg config.Config, id primitive.ObjectID, estado models.EstadoSolicitud) error
	ObtenerSolicitudPendientePorLinea(cfg config.Config, lineaID primitive.ObjectID) (*models.SolicitudEdicion, error)
}

type LineaRepositoryParaSolicitud interface {
	ObtenerLineaPorID(cfg config.Config, id primitive.ObjectID) (*models.LineaRecoleccion, error)
}

type RemitoRepositoryParaSolicitud interface {
	ObtenerRemitoPorID(cfg config.Config, ID primitive.ObjectID) (*models.Remito, error)
}

type SolicitudEdicionService struct {
	repo       SolicitudEdicionRepository
	lineaRepo  LineaRepositoryParaSolicitud
	remitoRepo RemitoRepositoryParaSolicitud
	cfg        config.Config
}

func NewSolicitudEdicionService(
	repo SolicitudEdicionRepository,
	lineaRepo LineaRepositoryParaSolicitud,
	remitoRepo RemitoRepositoryParaSolicitud,
	cfg config.Config,
) SolicitudEdicionService {
	return SolicitudEdicionService{
		repo:       repo,
		lineaRepo:  lineaRepo,
		remitoRepo: remitoRepo,
		cfg:        cfg,
	}
}

// CrearSolicitud — el camionero crea una solicitud de edición para una línea.
func (s SolicitudEdicionService) CrearSolicitud(model models.SolicitudEdicion, camioneroID primitive.ObjectID) error {
	if model.LineaRecoleccionID.IsZero() {
		return errors.New("línea de recolección requerida")
	}
	if model.Motivo == "" {
		return errors.New("motivo requerido")
	}

	// Verificar que la línea exista
	linea, err := s.lineaRepo.ObtenerLineaPorID(s.cfg, model.LineaRecoleccionID)
	if err != nil {
		return errors.New("línea de recolección no encontrada")
	}

	// Verificar que el camionero sea dueño del remito
	remito, err := s.remitoRepo.ObtenerRemitoPorID(s.cfg, linea.RemitoID)
	if err != nil {
		return errors.New("remito no encontrado")
	}
	if remito.CamioneroID != camioneroID {
		return errors.New("no tenés permiso para solicitar edición de esta línea")
	}

	// Verificar que no exista ya una solicitud pendiente para esta línea
	solicitudExistente, _ := s.repo.ObtenerSolicitudAprobadaPorLinea(s.cfg, model.LineaRecoleccionID)
	if solicitudExistente != nil {
		return errors.New("ya existe una solicitud aprobada para esta línea")
	}
	// Verificar que no exista ya una solicitud pendiente para esta línea
	solicitudPendiente, _ := s.repo.ObtenerSolicitudPendientePorLinea(s.cfg, model.LineaRecoleccionID)
	if solicitudPendiente != nil {
		return errors.New("ya existe una solicitud pendiente para esta línea")
	}

	model.CamioneroID = camioneroID
	model.Estado = models.SolicitudPendiente
	return s.repo.CrearSolicitud(s.cfg, model)
}

// ObtenerSolicitudes devuelve todas las solicitudes — solo encargado.
func (s SolicitudEdicionService) ObtenerSolicitudes() ([]models.SolicitudEdicion, error) {
	return s.repo.ObtenerSolicitudes(s.cfg)
}

// ObtenerSolicitudPorID busca una solicitud por su ID.
func (s SolicitudEdicionService) ObtenerSolicitudPorID(id primitive.ObjectID) (*models.SolicitudEdicion, error) {
	if id.IsZero() {
		return nil, errors.New("ID inválido")
	}
	return s.repo.ObtenerSolicitudPorID(s.cfg, id)
}

// ObtenerSolicitudesPorCamionero devuelve las solicitudes de un camionero.
func (s SolicitudEdicionService) ObtenerSolicitudesPorCamionero(camioneroID primitive.ObjectID) ([]models.SolicitudEdicion, error) {
	if camioneroID.IsZero() {
		return nil, errors.New("ID de camionero inválido")
	}
	return s.repo.ObtenerSolicitudesPorCamionero(s.cfg, camioneroID)
}

// TomarDecision — el encargado aprueba o rechaza una solicitud.
func (s SolicitudEdicionService) TomarDecision(id primitive.ObjectID, estado models.EstadoSolicitud) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	if estado != models.SolicitudAprobada && estado != models.SolicitudRechazada {
		return errors.New("estado inválido — debe ser aprobada o rechazada")
	}
	solicitud, err := s.repo.ObtenerSolicitudPorID(s.cfg, id)
	if err != nil {
		return errors.New("solicitud no encontrada")
	}
	if solicitud.Estado != models.SolicitudPendiente {
		return errors.New("la solicitud ya fue procesada")
	}
	return s.repo.ActualizarEstadoSolicitud(s.cfg, id, estado)
}
