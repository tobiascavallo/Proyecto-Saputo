package services

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/dto"
	"github.com/tobiascavallo/RecoleccionLactea/models"
)

type EmpresaTransportistaRepository interface {
	CrearEmpresaTransportista(cfg config.Config, model models.EmpresaTransportista) error
	ObtenerEmpresasTransportistas(cfg config.Config) ([]models.EmpresaTransportista, error)
	ObtenerEmpresaTransportistaPorId(cfg config.Config, id string) (models.EmpresaTransportista, error)
	ActualizarEmpresaTransportista(cfg config.Config, id string, model models.EmpresaTransportista) error
	EliminarEmpresaTransportista(cfg config.Config, id string) error
}

type EmpresaTransportistaService struct {
	repo EmpresaTransportistaRepository
	cfg  config.Config
}

func NewEmpresaTransportistaService(repo EmpresaTransportistaRepository, cfg config.Config) EmpresaTransportistaService {
	return EmpresaTransportistaService{repo: repo, cfg: cfg}
}

func (s EmpresaTransportistaService) CrearEmpresaTransportista(empresa dto.EmpresaTransportistaRequestDTO) error {
	//validaciones
	if strings.TrimSpace(empresa.Nombre) == "" {
		return fmt.Errorf("el nombre de la empresa transportista no puede estar vacio")
	}
	if strings.TrimSpace(empresa.Cuit) == "" {
		return fmt.Errorf("el cuit de la empresa transportista no puede estar vacio")
	}
	if strings.TrimSpace(empresa.Domicilio) == "" {
		return fmt.Errorf("el domicilio de la empresa transportista no puede estar vacio")
	}
	//validacion de cuit mediante algorito Modulo 11(algoritmo oficial).
	valido, err := ValidarCuitEmpresa(empresa.Cuit)
	if err != nil {
		return err
	}
	if !valido {
		return fmt.Errorf("el cuit de la empresa transportista no es válido")
	}

	empresaTransportistaModel := dto.GetModelEmpresaTransportista(&empresa)
	return s.repo.CrearEmpresaTransportista(s.cfg, *empresaTransportistaModel)
}

func (s EmpresaTransportistaService) ObtenerEmpresasTransportistas() ([]*dto.EmpresaTransportistaResponseDTO, error) {
	empresasDB, err := s.repo.ObtenerEmpresasTransportistas(s.cfg)
	if err != nil {
		return nil, err
	}

	empresas := make([]*dto.EmpresaTransportistaResponseDTO, 0, len(empresasDB)) //por si viene nil desde mongo, se convierte en []
	for _, empresaDB := range empresasDB {
		empresa := dto.NewEmpresaTransportistaResponseDto(empresaDB)
		empresas = append(empresas, empresa)
	}
	return empresas, nil
}

func (s EmpresaTransportistaService) ObtenerEmpresaTransportistaPorId(id string) (*dto.EmpresaTransportistaResponseDTO, error) {
	empresa, err := s.repo.ObtenerEmpresaTransportistaPorId(s.cfg, id)
	if err != nil {
		return nil, err
	}
	return dto.NewEmpresaTransportistaResponseDto(empresa), nil
}

func (s EmpresaTransportistaService) ActualizarEmpresaTransportista(id string, empresa dto.EmpresaTransportistaUpdateDTO) error {
	//ver existencia de id
	empresaResultado, err := s.repo.ObtenerEmpresaTransportistaPorId(s.cfg, id)
	if err != nil {
		return err //no se encontro la empresa
	}
	empresaDto := dto.NewEmpresaTransportistaRequestToModel(empresaResultado)

	//validaciones y asignaciones de valores
	if empresa.Nombre != nil {
		empresaDto.Nombre = *empresa.Nombre
	}
	if empresa.Domicilio != nil {
		empresaDto.Domicilio = *empresa.Domicilio
	}
	if empresa.Cuit != nil {
		//validar cuit
		valido, err := ValidarCuitEmpresa(*empresa.Cuit)
		if err != nil {
			return err
		}
		if !valido {
			return fmt.Errorf("el cuit de la empresa transportista no es válido")
		}
		empresaDto.Cuit = *empresa.Cuit
	}

	//logica
	result := s.repo.ActualizarEmpresaTransportista(s.cfg, id, *dto.GetModelEmpresaTransportista(empresaDto))
	if result != nil {
		return result
	}
	return nil
}

func (s EmpresaTransportistaService) EliminarEmpresaTransportista(id string) error {
	_, err := s.repo.ObtenerEmpresaTransportistaPorId(s.cfg, id)
	if err != nil {
		return err
	}

	result := s.repo.EliminarEmpresaTransportista(s.cfg, id)
	if result != nil {
		return result
	}
	return nil
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
	factores := []int{5, 4, 3, 2, 7, 6, 5, 4, 3, 2}
	suma := 0

	for i := 0; i < 10; i++ {
		// Convertimos cada caracter a su valor numérico entero
		digito, _ := strconv.Atoi(string(cuitLimpio[i]))
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

	if digitoVerificadorCalculado != digitoVerificadorReal {
		return false, fmt.Errorf("el CUIT es inválido (el dígito verificador no coincide)")
	}

	return true, nil
}
