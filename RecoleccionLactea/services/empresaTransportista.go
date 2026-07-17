package services

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EmpresaTransportistaRepository interface {
	CrearEmpresaTransportista(cfg config.Config, model models.EmpresaTransportista) error
	ObtenerEmpresasTransportistas(cfg config.Config) ([]models.EmpresaTransportista, error)
	ObtenerEmpresaTransportistaPorId(cfg config.Config, id primitive.ObjectID) (models.EmpresaTransportista, error)
	ActualizarEmpresaTransportista(cfg config.Config, id primitive.ObjectID, model models.EmpresaTransportista) error
	DesactivarEmpresaTransportista(cfg config.Config, id primitive.ObjectID) error
}

type EmpresaTransportistaService struct {
	repo EmpresaTransportistaRepository
	cfg  config.Config
}

func NewEmpresaTransportistaService(repo EmpresaTransportistaRepository, cfg config.Config) EmpresaTransportistaService {
	return EmpresaTransportistaService{repo: repo, cfg: cfg}
}

func (s EmpresaTransportistaService) CrearEmpresaTransportista(model models.EmpresaTransportista) error {
	if strings.TrimSpace(model.Nombre) == "" {
		return fmt.Errorf("el nombre de la empresa transportista no puede estar vacío")
	}
	if strings.TrimSpace(model.Cuit) == "" {
		return fmt.Errorf("el cuit de la empresa transportista no puede estar vacío")
	}
	if strings.TrimSpace(model.Domicilio) == "" {
		return fmt.Errorf("el domicilio de la empresa transportista no puede estar vacío")
	}

	valido, err := ValidarCuitEmpresa(model.Cuit)
	if err != nil {
		return err
	}
	if !valido {
		return fmt.Errorf("el cuit de la empresa transportista no es válido")
	}

	model.Activo = true
	return s.repo.CrearEmpresaTransportista(s.cfg, model)
}

func (s EmpresaTransportistaService) ObtenerEmpresasTransportistas() ([]models.EmpresaTransportista, error) {
	empresas, err := s.repo.ObtenerEmpresasTransportistas(s.cfg)
	if err != nil {
		return nil, fmt.Errorf("error al obtener empresas transportistas: %w", err)
	}
	if len(empresas) == 0 {
		return []models.EmpresaTransportista{}, nil // devuelve lista vacía en lugar de nil
	}
	return empresas, nil
}

func (s EmpresaTransportistaService) ObtenerEmpresaTransportistaPorId(id primitive.ObjectID) (*models.EmpresaTransportista, error) {
	if id.IsZero() {
		return nil, fmt.Errorf("ID inválido")
	}
	empresa, err := s.repo.ObtenerEmpresaTransportistaPorId(s.cfg, id)
	if err != nil {
		return nil, err
	}
	return &empresa, nil
}

func (s EmpresaTransportistaService) ActualizarEmpresaTransportista(id primitive.ObjectID, model models.EmpresaTransportista) error {
	if id.IsZero() {
		return fmt.Errorf("ID inválido")
	}

	_, err := s.repo.ObtenerEmpresaTransportistaPorId(s.cfg, id)
	if err != nil {
		return fmt.Errorf("empresa transportista no encontrada")
	}

	if model.Nombre != "" && strings.TrimSpace(model.Nombre) == "" {
		return fmt.Errorf("el nombre no puede ser solo espacios")
	}
	if model.Domicilio != "" && strings.TrimSpace(model.Domicilio) == "" {
		return fmt.Errorf("el domicilio no puede ser solo espacios")
	}
	if model.Cuit != "" {
		valido, err := ValidarCuitEmpresa(model.Cuit)
		if err != nil {
			return err
		}
		if !valido {
			return fmt.Errorf("el cuit no es válido")
		}
	}

	return s.repo.ActualizarEmpresaTransportista(s.cfg, id, model)
}

func (s EmpresaTransportistaService) DesactivarEmpresaTransportista(id primitive.ObjectID) error {
	if id.IsZero() {
		return fmt.Errorf("ID inválido")
	}

	_, err := s.repo.ObtenerEmpresaTransportistaPorId(s.cfg, id)
	if err != nil {
		return fmt.Errorf("empresa transportista no encontrada")
	}

	return s.repo.DesactivarEmpresaTransportista(s.cfg, id)
}

// ValidarCuitEmpresa realiza la validación completa de un CUIT de persona jurídica (empresa)
func ValidarCuitEmpresa(cuitRaw string) (bool, error) {
	// 1. Verificar si está vacío o solo contiene espacios
	cuitLimpio := strings.TrimSpace(cuitRaw)
	if cuitLimpio == "" {
		return false, fmt.Errorf("el CUIT no puede estar vacío")
	}

	// 2. Quitar guiones o espacios intermedios
	cuitLimpio = strings.ReplaceAll(cuitLimpio, "-", "")
	cuitLimpio = strings.ReplaceAll(cuitLimpio, " ", "")

	// 3. Verificar que tenga exactamente 11 caracteres y sean solo números
	if len(cuitLimpio) != 11 {
		return false, fmt.Errorf("el CUIT debe tener exactamente 11 dígitos")
	}

	_, err := strconv.ParseUint(cuitLimpio, 10, 64)
	if err != nil {
		return false, fmt.Errorf("el CUIT solo debe contener números y guiones")
	}

	// 4. (Opcional) Verificar prefijo de Empresa/Persona Jurídica
	// Los prefijos comunes de empresas en Argentina son 30, 33, 34 (y a veces 35 en casos muy especiales)
	prefijo := cuitLimpio[:2]
	if prefijo != "30" && prefijo != "33" && prefijo != "34" {
		return false, fmt.Errorf("el CUIT no pertenece a una empresa/persona jurídica válida (debe empezar con 30, 33 o 34)")
	}

	// 5. Algoritmo Módulo 11 (Validación del dígito verificador)
	factores := []int{2, 3, 4, 5, 6, 7, 2, 3, 4, 5}
	suma := 0

	for i := 0; i < 10; i++ {
		digito, _ := strconv.Atoi(string(cuitLimpio[9-i]))
		suma += digito * factores[i]
	}

	resultadoMod := suma % 11
	digitoVerificadorCalculado := 11 - resultadoMod

	if digitoVerificadorCalculado == 11 {
		digitoVerificadorCalculado = 0
	} else if digitoVerificadorCalculado == 10 {
		// La AFIP maneja un caso especial: si da 10, el CUIT es inválido (o se cambia el prefijo, pero a nivel validación simple se descarta)
		return false, fmt.Errorf("CUIT inválido (resultado del dígito verificador inconsistente)")
	}

	// Obtener el último dígito del CUIT ingresado
	digitoVerificadorReal, _ := strconv.Atoi(string(cuitLimpio[10]))
	fmt.Println("CUIT limpio:", cuitLimpio)
	fmt.Println("Suma:", suma)
	fmt.Println("Resultado mod:", resultadoMod)
	fmt.Println("Dígito calculado:", digitoVerificadorCalculado)
	fmt.Println("Dígito real:", digitoVerificadorReal)
	if digitoVerificadorCalculado != digitoVerificadorReal {
		return false, fmt.Errorf("el CUIT es inválido (el dígito verificador no coincide)")
	}

	return true, nil
}
