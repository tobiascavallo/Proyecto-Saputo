package services

import (
	"errors"
	"fmt"
	"strings"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"github.com/tobiascavallo/RecoleccionLactea/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TamberoRepository interface {
	CrearTambero(cfg config.Config, model models.Tambero) error
	ObtenerTamberos(cfg config.Config) ([]models.Tambero, error)
	ObtenerTamberoPorID(cfg config.Config, id primitive.ObjectID) (*models.Tambero, error)
	ObtenerTamberoPorCuit(cfg config.Config, cuit string) (*models.Tambero, error)
	ObtenerTamberoPorEmail(cfg config.Config, email string) (*models.Tambero, error)
	ObtenerTamberoPorTelefono(cfg config.Config, telefono string) (*models.Tambero, error)
	ActualizarTambero(cfg config.Config, id primitive.ObjectID, model models.Tambero) error
	DesactivarTambero(cfg config.Config, id primitive.ObjectID) error
}

type TamberoService struct {
	repo TamberoRepository
	cfg  config.Config
}

func NewTamberoService(repo TamberoRepository, cfg config.Config) TamberoService {
	return TamberoService{repo: repo, cfg: cfg}
}

func (s TamberoService) CrearTambero(model models.Tambero) error {
	if strings.TrimSpace(model.Nombre) == "" {
		return fmt.Errorf("nombre de tambero invalido")
	}

	if strings.TrimSpace(model.Telefono) == "" {
		return fmt.Errorf("telefono invalido")
	}
	if strings.TrimSpace(model.Email) == "" {
		return fmt.Errorf("email invalido")
	}
	if err := utils.ValidarEmail(model.Email); err != nil {
		return err
	}

	// Verificar que el teléfono no esté duplicado
	tamberoExistenteTel, _ := s.repo.ObtenerTamberoPorTelefono(s.cfg, model.Telefono)
	if tamberoExistenteTel != nil {
		return errors.New("el teléfono ya está registrado")
	}
	// Verificar que el email no esté registrado
	tamberoExistente, _ := s.repo.ObtenerTamberoPorEmail(s.cfg, model.Email)
	if tamberoExistente != nil {
		return errors.New("el email ya está registrado")
	}
	model.Activo = true
	return s.repo.CrearTambero(s.cfg, model)
}

func (s TamberoService) ObtenerTamberos() ([]models.Tambero, error) {
	return s.repo.ObtenerTamberos(s.cfg)
}

func (s TamberoService) ObtenerTamberoPorID(id primitive.ObjectID) (*models.Tambero, error) {
	if id.IsZero() {
		return nil, errors.New("ID inválido")
	}
	return s.repo.ObtenerTamberoPorID(s.cfg, id)
}

func (s TamberoService) ObtenerTamberoPorEmail(email string) (*models.Tambero, error) {
	if strings.TrimSpace(email) == "" {
		return nil, errors.New("email invalido")
	}
	if err := utils.ValidarEmail(email); err != nil {
		return nil, err
	}
	return s.repo.ObtenerTamberoPorEmail(s.cfg, email)
}

func (s TamberoService) ObtenerTamberoPorTelefono(telefono string) (*models.Tambero, error) {
	if strings.TrimSpace(telefono) == "" {
		return nil, errors.New("telefono invalido")
	}
	return s.repo.ObtenerTamberoPorTelefono(s.cfg, telefono)
}

func (s TamberoService) ObtenerTamberoPorCuit(cuit string) (*models.Tambero, error) {
	if strings.TrimSpace(cuit) == "" {
		return nil, errors.New("cuit invalido")
	}
	return s.repo.ObtenerTamberoPorCuit(s.cfg, cuit)
}

func (s TamberoService) ActualizarTambero(id primitive.ObjectID, model models.Tambero) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}

	tamberoExistente, err := s.repo.ObtenerTamberoPorID(s.cfg, id)
	if err != nil {
		return err
	}
	if tamberoExistente == nil {
		return errors.New("el tambero no existe")
	}

	if strings.TrimSpace(model.Nombre) != "" {
		tamberoExistente.Nombre = model.Nombre
	}

	if strings.TrimSpace(model.Cuit) != "" {
		valido, err := utils.ValidarCuitPersona(model.Cuit)
		if err != nil {
			return err
		}
		if !valido {
			return fmt.Errorf("el CUIT del tambero no es válido")
		}
		existente, _ := s.repo.ObtenerTamberoPorCuit(s.cfg, model.Cuit)
		if existente != nil && existente.ID != id {
			return errors.New("el CUIT ya está registrado")
		}
		tamberoExistente.Cuit = model.Cuit
	}

	if strings.TrimSpace(model.Telefono) != "" {
		existente, _ := s.repo.ObtenerTamberoPorTelefono(s.cfg, model.Telefono)
		if existente != nil && existente.ID != id {
			return errors.New("el teléfono ya está registrado")
		}
		tamberoExistente.Telefono = model.Telefono
	}

	if strings.TrimSpace(model.Email) != "" {
		if err := utils.ValidarEmail(model.Email); err != nil {
			return err
		}
		existente, _ := s.repo.ObtenerTamberoPorEmail(s.cfg, model.Email)
		if existente != nil && existente.ID != id {
			return errors.New("el email ya está registrado")
		}
		tamberoExistente.Email = model.Email
	}

	// Activo nunca se toca acá: viene de tamberoExistente, leído de la BD
	return s.repo.ActualizarTambero(s.cfg, id, *tamberoExistente)
}

func (s TamberoService) DesactivarTambero(id primitive.ObjectID) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	tamberoExiste, err := s.repo.ObtenerTamberoPorID(s.cfg, id)
	if err != nil {
		return err
	}
	if tamberoExiste == nil {
		return errors.New("el tambero no existe")
	}
	return s.repo.DesactivarTambero(s.cfg, id)
}
