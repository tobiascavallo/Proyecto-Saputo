package services

import (
	"errors"
	"regexp"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type VehiculoRepository interface {
	CrearVehiculo(cfg config.Config, model models.Vehiculo) error
	ObtenerVehiculos(cfg config.Config) ([]models.Vehiculo, error)
	ObtenerVehiculosPorID(cfg config.Config, ID primitive.ObjectID) (*models.Vehiculo, error)
	ActualizarVehiculo(cfg config.Config, id primitive.ObjectID, model models.Vehiculo) error
	DesactivarVehiculo(cfg config.Config, id primitive.ObjectID) error
	ObtenerVehiculosPorEmpresa(cfg config.Config, empresaID primitive.ObjectID) ([]models.Vehiculo, error)
	ObtenerVehiculoPorPatente(cfg config.Config, patente string) (*models.Vehiculo, error)
}

type EmpresaTransportistaRepositoryPorVehiculo interface {
	ObtenerEmpresaTransportistaPorId(cfg config.Config, id primitive.ObjectID) (models.EmpresaTransportista, error)
}

type VehiculoService struct {
	repo VehiculoRepository
	cfg  config.Config
	emp  EmpresaTransportistaRepositoryPorVehiculo
}

func NewVehiculoService(repo VehiculoRepository, cfg config.Config, emp EmpresaTransportistaRepository) VehiculoService {
	return VehiculoService{repo: repo, cfg: cfg, emp: emp}
}

// CrearVehiculo valida los datos y crea el vehículo.
func (s VehiculoService) CrearVehiculo(model models.Vehiculo) error {
	if err := validarPatente(model.Patente); err != nil {
		return err
	}
	_, err := s.emp.ObtenerEmpresaTransportistaPorId(s.cfg, model.EmpresaTransportistaID)
	if err != nil {
		return errors.New("la empresa transportista no existe")
	}
	if err := validarTipoVehiculo(model.Tipo); err != nil {
		return err
	}

	if model.HabilitacionSenasa == "" {
		return errors.New("la habilitación SENASA es requerida")
	}

	if model.EmpresaTransportistaID.IsZero() {
		return errors.New("empresa transportista requerida")
	}

	// Verificar patente duplicada
	existente, _ := s.repo.ObtenerVehiculoPorPatente(s.cfg, model.Patente)
	if existente != nil {
		return errors.New("ya existe un vehículo con esa patente")
	}

	return s.repo.CrearVehiculo(s.cfg, model)
}

// ObtenerVehiculos devuelve todos los vehículos del sistema.
func (s VehiculoService) ObtenerVehiculos() ([]models.Vehiculo, error) {
	return s.repo.ObtenerVehiculos(s.cfg)
}

// ObtenerVehiculoPorID busca un vehículo por su ID.
func (s VehiculoService) ObtenerVehiculoPorID(id primitive.ObjectID) (*models.Vehiculo, error) {
	if id.IsZero() {
		return nil, errors.New("ID inválido")
	}
	return s.repo.ObtenerVehiculosPorID(s.cfg, id)
}

// ActualizarVehiculo modifica los datos de un vehículo.
func (s VehiculoService) ActualizarVehiculo(id primitive.ObjectID, model models.Vehiculo) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}

	_, err := s.repo.ObtenerVehiculosPorID(s.cfg, id)
	if err != nil {
		return errors.New("vehículo no encontrado")
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
		// Verificar que la patente nueva no esté en uso por otro vehículo
		existente, _ := s.repo.ObtenerVehiculoPorPatente(s.cfg, model.Patente)
		if existente != nil && existente.ID != id {
			return errors.New("ya existe un vehículo con esa patente")
		}
	}

	if model.Tipo != "" {
		if err := validarTipoVehiculo(model.Tipo); err != nil {
			return err
		}
	}

	return s.repo.ActualizarVehiculo(s.cfg, id, model)
}

// DesactivarVehiculo realiza la baja lógica del vehículo.
func (s VehiculoService) DesactivarVehiculo(id primitive.ObjectID) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	_, err := s.repo.ObtenerVehiculosPorID(s.cfg, id)
	if err != nil {
		return errors.New("vehículo no encontrado")
	}
	return s.repo.DesactivarVehiculo(s.cfg, id)
}

// ObtenerVehiculosPorEmpresa lista todos los vehículos de una empresa transportista.
func (s VehiculoService) ObtenerVehiculosPorEmpresa(empresaID primitive.ObjectID) ([]models.Vehiculo, error) {
	if empresaID.IsZero() {
		return nil, errors.New("ID de empresa inválido")
	}
	return s.repo.ObtenerVehiculosPorEmpresa(s.cfg, empresaID)
}

// en este metodo validamos ambos formatos existentes en argentina
func validarPatente(patente string) error {
	if patente == "" {
		return errors.New("la patente es requerida")
	}
	patenteVieja := regexp.MustCompile(`^[A-Z]{3}[0-9]{3}$`)
	patenteMercosur := regexp.MustCompile(`^[A-Z]{2}[0-9]{3}[A-Z]{2}$`)
	if !patenteVieja.MatchString(patente) && !patenteMercosur.MatchString(patente) {
		return errors.New("formato de patente inválido (ej: ABC123 o AB123CD)")
	}
	return nil
}

// aca validamos que el tipo de vehiculo sea alguno q exista en el programa
func validarTipoVehiculo(tipo models.TipoVehiculo) error {
	if tipo != models.Camion && tipo != models.TractorSemiRemolque {
		return errors.New("tipo de vehículo inválido")
	}
	return nil
}
