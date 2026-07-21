package services

import (
	"errors"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TamboRepository interface {
	CrearTambo(cfg config.Config, model models.Tambo) error
	ObtenerTambos(cfg config.Config) ([]models.Tambo, error)
	ObtenerTamboPorID(cfg config.Config, id primitive.ObjectID) (*models.Tambo, error)
	ObtenerTambosPorTambero(cfg config.Config, tamberoID primitive.ObjectID) ([]models.Tambo, error)
	ObtenerTamboPorNumeroTambo(cfg config.Config, numero int) (*models.Tambo, error)
	ActualizarTambo(cfg config.Config, id primitive.ObjectID, model models.Tambo) error
	DesactivarTambo(cfg config.Config, id primitive.ObjectID) error
}

type TamboService struct {
	repo        TamboRepository
	repoTambero TamberoRepository
	cfg         config.Config
}

func NewTamboService(repo TamboRepository, repoTambero TamberoRepository, cfg config.Config) TamboService {
	return TamboService{repo: repo, cfg: cfg}
}

func (s TamboService) CrearTambo(model models.Tambo) error {
	if model.TamberoID.IsZero() {
		return errors.New("ID de tambero inválido")
	}
	if model.NumeroTambo <= 0 {
		return errors.New("numero de tambo invalido")
	}
	// Validar que no exista otro tambo activo con el mismo número
	tamboExistente, err := s.repo.ObtenerTamboPorNumeroTambo(s.cfg, model.NumeroTambo)
	if err == nil && tamboExistente != nil {
		return errors.New("ya existe un tambo registrado con ese número")
	}
	model.Activo = true
	return s.repo.CrearTambo(s.cfg, model)
}

func (s TamboService) ObtenerTambos() ([]models.Tambo, error) {
	return s.repo.ObtenerTambos(s.cfg)
}

func (s TamboService) ObtenerTamboPorID(id primitive.ObjectID) (*models.Tambo, error) {
	if id.IsZero() {
		return nil, errors.New("ID invalido")
	}
	return s.repo.ObtenerTamboPorID(s.cfg, id)
}

func (s TamboService) ObtenerTambosPorTambero(id primitive.ObjectID) ([]models.Tambo, error) {
	if id.IsZero() {
		return nil, errors.New("ID invalido")
	}
	// validar existencia de tambero
	tambero, err := s.repoTambero.ObtenerTamberoPorID(s.cfg, id)
	if err != nil {
		return nil, err
	}
	if tambero == nil {
		return nil, errors.New("tambero no encontrado")
	}
	return s.repo.ObtenerTambosPorTambero(s.cfg, id)
}

func (s TamboService) ObtenerTamboPorNumeroTambo(numero int) (*models.Tambo, error) {
	if numero <= 0 {
		return nil, errors.New("numero de tambo invalido")
	}
	return s.repo.ObtenerTamboPorNumeroTambo(s.cfg, numero)
}

func (s TamboService) ActualizarTambo(id primitive.ObjectID, model models.Tambo) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	tamboExistente, err := s.repo.ObtenerTamboPorID(s.cfg, id)
	if err != nil {
		return err
	}
	if tamboExistente == nil {
		return errors.New("el tambo no existe")
	}
	if model.NumeroTambo > 0 {
		// Si el número cambió, verificar que no esté ocupado por otro tambo
		if model.NumeroTambo != tamboExistente.NumeroTambo {
			tamboConMismoNumero, err := s.repo.ObtenerTamboPorNumeroTambo(s.cfg, model.NumeroTambo)
			if err == nil && tamboConMismoNumero != nil && tamboConMismoNumero.ID != id {
				return errors.New("ya existe otro tambo con ese número")
			}
		}
		tamboExistente.NumeroTambo = model.NumeroTambo
	}
	if !model.TamberoID.IsZero() {
		tamboExistente.TamberoID = model.TamberoID
	}
	return s.repo.ActualizarTambo(s.cfg, id, *tamboExistente)
}

func (s TamboService) DesactivarTambo(id primitive.ObjectID) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	tamboExiste, err := s.repo.ObtenerTamboPorID(s.cfg, id)
	if err != nil {
		return err
	}
	if tamboExiste == nil {
		return errors.New("el tambo no existe")
	}
	return s.repo.DesactivarTambo(s.cfg, id)
}
