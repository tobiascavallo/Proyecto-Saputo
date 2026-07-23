package services

import (
	"errors"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LineaRecoleccionRepository interface {
	CrearLineaRecoleccion(cfg config.Config, model models.LineaRecoleccion) error
	ObtenerLineas(cfg config.Config) ([]models.LineaRecoleccion, error)
	ObtenerLineaPorID(cfg config.Config, id primitive.ObjectID) (*models.LineaRecoleccion, error)
	ObtenerLineasPorRemito(cfg config.Config, remitoID primitive.ObjectID) ([]models.LineaRecoleccion, error)
	ObtenerLineasPorTambo(cfg config.Config, tamboID primitive.ObjectID) ([]models.LineaRecoleccion, error)
	ObtenerLineasPorCisterna(cfg config.Config, remitoID primitive.ObjectID, numeroCisterna int) ([]models.LineaRecoleccion, error)
	ObtenerLineaPorCodigoMuestra(cfg config.Config, codigo string) (*models.LineaRecoleccion, error)
	ActualizarLineaRecoleccion(cfg config.Config, id primitive.ObjectID, model models.LineaRecoleccion) error
}

type SolicitudEdicionRepositoryParaLinea interface {
	ObtenerSolicitudAprobadaPorLinea(cfg config.Config, lineaID primitive.ObjectID) (*models.SolicitudEdicion, error)
}

type RemitoRepositoryParaLinea interface {
	ObtenerRemitoPorID(cfg config.Config, ID primitive.ObjectID) (*models.Remito, error)
}

type TamboRepositoryParaLinea interface {
	ObtenerTamboPorID(cfg config.Config, id primitive.ObjectID) (*models.Tambo, error)
}

type LineaRecoleccionService struct {
	repo          LineaRecoleccionRepository
	remitoRepo    RemitoRepositoryParaLinea
	tamboRepo     TamboRepositoryParaLinea
	solicitudRepo SolicitudEdicionRepositoryParaLinea
	cfg           config.Config
}

func NewLineaRecoleccionService(
	repo LineaRecoleccionRepository,
	remitoRepo RemitoRepositoryParaLinea,
	tamboRepo TamboRepositoryParaLinea,
	solicitudRepo SolicitudEdicionRepositoryParaLinea,
	cfg config.Config,
) LineaRecoleccionService {
	return LineaRecoleccionService{
		repo:          repo,
		remitoRepo:    remitoRepo,
		tamboRepo:     tamboRepo,
		solicitudRepo: solicitudRepo,
		cfg:           cfg,
	}
}

// CrearLineaRecoleccion valida y crea una línea de recolección asociada a un remito.
func (s LineaRecoleccionService) CrearLineaRecoleccion(model models.LineaRecoleccion, camioneroID primitive.ObjectID) error {
	if model.RemitoID.IsZero() {
		return errors.New("remito requerido")
	}
	if model.TamboID.IsZero() {
		return errors.New("tambo requerido")
	}
	if model.LitrosRecibidos <= 0 {
		return errors.New("litros recibidos inválidos")
	}
	if model.NumeroCisterna <= 0 {
		return errors.New("número de cisterna inválido")
	}
	if model.CodigoMuestraDiaria == "" {
		return errors.New("código de muestra diaria requerido")
	}

	// Verificar que el remito exista y esté en curso
	remito, err := s.remitoRepo.ObtenerRemitoPorID(s.cfg, model.RemitoID)
	if err != nil {
		return errors.New("remito no encontrado")
	}
	if remito.EstadoRemito != models.EstadoRemitoEnCurso {
		return errors.New("no se pueden agregar líneas a un remito finalizado")
	}
	if remito.CamioneroID != camioneroID {
		return errors.New("no tenés permiso para agregar líneas a este remito")
	}

	// Verificar que el tambo exista
	_, err = s.tamboRepo.ObtenerTamboPorID(s.cfg, model.TamboID)
	if err != nil {
		return errors.New("tambo no encontrado")
	}

	return s.repo.CrearLineaRecoleccion(s.cfg, model)
}

// ObtenerLineas devuelve todas las líneas de recolección.
func (s LineaRecoleccionService) ObtenerLineas() ([]models.LineaRecoleccion, error) {
	return s.repo.ObtenerLineas(s.cfg)
}

// ObtenerLineaPorID busca una línea por su ID.
func (s LineaRecoleccionService) ObtenerLineaPorID(id primitive.ObjectID) (*models.LineaRecoleccion, error) {
	if id.IsZero() {
		return nil, errors.New("ID inválido")
	}
	return s.repo.ObtenerLineaPorID(s.cfg, id)
}

// ObtenerLineasPorRemito devuelve todas las líneas de un remito específico.
func (s LineaRecoleccionService) ObtenerLineasPorRemito(remitoID primitive.ObjectID) ([]models.LineaRecoleccion, error) {
	if remitoID.IsZero() {
		return nil, errors.New("ID de remito inválido")
	}
	_, err := s.remitoRepo.ObtenerRemitoPorID(s.cfg, remitoID)
	if err != nil {
		return nil, errors.New("remito no encontrado")
	}
	return s.repo.ObtenerLineasPorRemito(s.cfg, remitoID)
}

// ObtenerLineasPorTambo devuelve todas las líneas de un tambo específico.
func (s LineaRecoleccionService) ObtenerLineasPorTambo(tamboID primitive.ObjectID) ([]models.LineaRecoleccion, error) {
	if tamboID.IsZero() {
		return nil, errors.New("ID de tambo inválido")
	}
	return s.repo.ObtenerLineasPorTambo(s.cfg, tamboID)
}

// ObtenerLineasPorCisterna devuelve todas las líneas de una cisterna en un remito — Regla 2 trazabilidad.
func (s LineaRecoleccionService) ObtenerLineasPorCisterna(remitoID primitive.ObjectID, numeroCisterna int) ([]models.LineaRecoleccion, error) {
	if remitoID.IsZero() {
		return nil, errors.New("ID de remito inválido")
	}
	if numeroCisterna <= 0 {
		return nil, errors.New("número de cisterna inválido")
	}
	return s.repo.ObtenerLineasPorCisterna(s.cfg, remitoID, numeroCisterna)
}

// ObtenerLineaPorCodigoMuestra busca una línea por código de muestra diaria o UFC.
func (s LineaRecoleccionService) ObtenerLineaPorCodigoMuestra(codigo string) (*models.LineaRecoleccion, error) {
	if codigo == "" {
		return nil, errors.New("código de muestra requerido")
	}
	return s.repo.ObtenerLineaPorCodigoMuestra(s.cfg, codigo)
}

// ActualizarLineaRecoleccion — solo permitido si existe una solicitud de edición aprobada.
func (s LineaRecoleccionService) ActualizarLineaRecoleccion(id primitive.ObjectID, model models.LineaRecoleccion) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	_, err := s.repo.ObtenerLineaPorID(s.cfg, id)
	if err != nil {
		return errors.New("línea de recolección no encontrada")
	}
	// TODO: verificar que existe una solicitud de edición aprobada para esta línea
	// cuando se implemente SolicitudEdicion
	return s.repo.ActualizarLineaRecoleccion(s.cfg, id, model)
}
