package services

import (
	"errors"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AcopladoRepository interface {
	CrearAcoplado(cfg config.Config, model models.Acoplado) error
	ObtenerAcoplado(cfg config.Config) ([]models.Acoplado, error)
	ObtenerAcopladoPorID(cfg config.Config, ID primitive.ObjectID) (*models.Acoplado, error)
	ActualizarAcoplado(cfg config.Config, id primitive.ObjectID, model models.Acoplado) error
	DesactivarAcoplado(cfg config.Config, id primitive.ObjectID) error
	ObtenerAcopladosPorEmpresa(cfg config.Config, empresaID primitive.ObjectID) ([]models.Acoplado, error)
	ObtenerAcopladoPorPatente(cfg config.Config, patente string) (*models.Acoplado, error)
}

type EmpresaTransportistaRepositoryParaAcoplado interface {
	ObtenerEmpresaTransportistaPorId(cfg config.Config, id primitive.ObjectID) (models.EmpresaTransportista, error)
}

type AcopladoService struct {
	repo AcopladoRepository
	emp  EmpresaTransportistaRepositoryParaAcoplado
	cfg  config.Config
}

func NewAcopladoService(repo AcopladoRepository, emp EmpresaTransportistaRepositoryParaAcoplado, cfg config.Config) AcopladoService {
	return AcopladoService{repo: repo, emp: emp, cfg: cfg}
}

func (s AcopladoService) CrearAcoplado(model models.Acoplado) error {
	if err := validarPatente(model.Patente); err != nil {
		return err
	}
	if err := validarTipoAcoplado(model.Tipo); err != nil {
		return err
	}
	if model.HabilitacionSenasa == "" {
		return errors.New("la habilitación SENASA es requerida")
	}
	if model.EmpresaTransportistaID.IsZero() {
		return errors.New("empresa transportista requerida")
	}
	_, err := s.emp.ObtenerEmpresaTransportistaPorId(s.cfg, model.EmpresaTransportistaID)
	if err != nil {
		return errors.New("la empresa transportista no existe")
	}
	existente, _ := s.repo.ObtenerAcopladoPorPatente(s.cfg, model.Patente)
	if existente != nil {
		return errors.New("ya existe un acoplado con esa patente")
	}
	model.Activo = true
	return s.repo.CrearAcoplado(s.cfg, model)
}

func (s AcopladoService) ObtenerAcoplados() ([]models.Acoplado, error) {
	return s.repo.ObtenerAcoplado(s.cfg)
}

func (s AcopladoService) ObtenerAcopladoPorID(id primitive.ObjectID) (*models.Acoplado, error) {
	if id.IsZero() {
		return nil, errors.New("ID inválido")
	}
	return s.repo.ObtenerAcopladoPorID(s.cfg, id)
}

func (s AcopladoService) ActualizarAcoplado(id primitive.ObjectID, model models.Acoplado) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	_, err := s.repo.ObtenerAcopladoPorID(s.cfg, id)
	if err != nil {
		return errors.New("acoplado no encontrado")
	}

	if !model.EmpresaTransportistaID.IsZero() {
		_, err := s.emp.ObtenerEmpresaTransportistaPorId(s.cfg, model.EmpresaTransportistaID)
		if err != nil {
			return errors.New("la empresa transportista no existe")
		}
	}
	if model.Patente != "" {
		if err := validarPatente(model.Patente); err != nil {
			return err
		}
		existente, _ := s.repo.ObtenerAcopladoPorPatente(s.cfg, model.Patente)
		if existente != nil && existente.ID != id {
			return errors.New("ya existe un acoplado con esa patente")
		}
	}
	if model.Tipo != "" {
		if err := validarTipoAcoplado(model.Tipo); err != nil {
			return err
		}
	}
	return s.repo.ActualizarAcoplado(s.cfg, id, model)
}

func (s AcopladoService) DesactivarAcoplado(id primitive.ObjectID) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	_, err := s.repo.ObtenerAcopladoPorID(s.cfg, id)
	if err != nil {
		return errors.New("acoplado no encontrado")
	}
	return s.repo.DesactivarAcoplado(s.cfg, id)
}

func (s AcopladoService) ObtenerAcopladosPorEmpresa(empresaID primitive.ObjectID) ([]models.Acoplado, error) {
	if empresaID.IsZero() {
		return nil, errors.New("ID de empresa inválido")
	}
	return s.repo.ObtenerAcopladosPorEmpresa(s.cfg, empresaID)
}

func validarTipoAcoplado(tipo models.TipoAcoplado) error {
	if tipo != models.AcopladoSimple && tipo != models.Semirremolque {
		return errors.New("tipo de acoplado inválido")
	}
	return nil
}
