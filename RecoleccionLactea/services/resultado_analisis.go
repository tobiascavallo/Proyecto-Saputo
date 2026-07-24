package services

import (
	"errors"
	"time"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ResultadoAnalisisRepository interface {
	CrearResultadoAnalisis(cfg config.Config, model models.ResultadoAnalisis) error
	ObtenerResultados(cfg config.Config) ([]models.ResultadoAnalisis, error)
	ObtenerResultadoPorID(cfg config.Config, id primitive.ObjectID) (*models.ResultadoAnalisis, error)
	ObtenerResultadosPorLinea(cfg config.Config, lineaID primitive.ObjectID) ([]models.ResultadoAnalisis, error)
	ObtenerResultadosPorEstado(cfg config.Config, estado models.Resultado) ([]models.ResultadoAnalisis, error)
	ObtenerResultadoPorLineaYTipo(cfg config.Config, lineaID primitive.ObjectID, tipo models.TipoMuestra) (*models.ResultadoAnalisis, error)
	ActualizarResultado(cfg config.Config, id primitive.ObjectID, model models.ResultadoAnalisis) error
}

type ResultadoSAPRepositoryParaResultado interface {
	ObtenerResultadoPorCodigo(cfg config.Config, codigo string) (*models.ResultadoSAP, error)
}

type LineaRepositoryParaResultado interface {
	ObtenerLineaPorID(cfg config.Config, id primitive.ObjectID) (*models.LineaRecoleccion, error)
	ObtenerLineaPorCodigoMuestra(cfg config.Config, codigo string) (*models.LineaRecoleccion, error)
}

type ResultadoAnalisisService struct {
	repo      ResultadoAnalisisRepository
	sapRepo   ResultadoSAPRepositoryParaResultado
	lineaRepo LineaRepositoryParaResultado
	cfg       config.Config
}

func NewResultadoAnalisisService(
	repo ResultadoAnalisisRepository,
	sapRepo ResultadoSAPRepositoryParaResultado,
	lineaRepo LineaRepositoryParaResultado,
	cfg config.Config,
) ResultadoAnalisisService {
	return ResultadoAnalisisService{
		repo:      repo,
		sapRepo:   sapRepo,
		lineaRepo: lineaRepo,
		cfg:       cfg,
	}
}

// ObtenerResultadoDesdeSAP consulta el SAP simulado por código de muestra y crea el resultado en nuestro sistema.
func (s ResultadoAnalisisService) ObtenerResultadoDesdeSAP(codigo string, encargadoID primitive.ObjectID) error {
	if codigo == "" {
		return errors.New("código de muestra requerido")
	}

	// Buscar la línea de recolección por el código
	linea, err := s.lineaRepo.ObtenerLineaPorCodigoMuestra(s.cfg, codigo)
	if err != nil {
		return errors.New("no se encontró ninguna línea con ese código de muestra")
	}

	// Consultar SAP simulado
	resultadoSAP, err := s.sapRepo.ObtenerResultadoPorCodigo(s.cfg, codigo)
	if err != nil {
		return errors.New("el resultado aún no está disponible en SAP")
	}

	// Verificar que no exista ya un resultado del mismo tipo para esta línea
	existente, _ := s.repo.ObtenerResultadoPorLineaYTipo(s.cfg, linea.ID, resultadoSAP.TipoMuestra)
	if existente != nil {
		return errors.New("ya existe un resultado registrado para esta línea y tipo de muestra")
	}

	// Crear el resultado en nuestro sistema
	nuevoResultado := models.ResultadoAnalisis{
		LineaRecoleccionID: linea.ID,
		TipoMuestra:        resultadoSAP.TipoMuestra,
		Resultado:          resultadoSAP.Resultado,
		Observaciones:      resultadoSAP.Observaciones,
		FechaCarga:         time.Now(),
		EncargadoID:        encargadoID,
	}

	return s.repo.CrearResultadoAnalisis(s.cfg, nuevoResultado)
}

// ObtenerResultados devuelve todos los resultados con filtro opcional por estado.
func (s ResultadoAnalisisService) ObtenerResultados(estado string) ([]models.ResultadoAnalisis, error) {
	if estado != "" {
		return s.repo.ObtenerResultadosPorEstado(s.cfg, models.Resultado(estado))
	}
	return s.repo.ObtenerResultados(s.cfg)
}

// ObtenerResultadoPorID busca un resultado por su ID.
func (s ResultadoAnalisisService) ObtenerResultadoPorID(id primitive.ObjectID) (*models.ResultadoAnalisis, error) {
	if id.IsZero() {
		return nil, errors.New("ID inválido")
	}
	return s.repo.ObtenerResultadoPorID(s.cfg, id)
}

// ObtenerResultadosPorLinea devuelve todos los resultados de una línea de recolección.
func (s ResultadoAnalisisService) ObtenerResultadosPorLinea(lineaID primitive.ObjectID) ([]models.ResultadoAnalisis, error) {
	if lineaID.IsZero() {
		return nil, errors.New("ID de línea inválido")
	}
	_, err := s.lineaRepo.ObtenerLineaPorID(s.cfg, lineaID)
	if err != nil {
		return nil, errors.New("línea de recolección no encontrada")
	}
	return s.repo.ObtenerResultadosPorLinea(s.cfg, lineaID)
}

// ActualizarResultado — el Encargado corrige un resultado cargado erróneamente.
func (s ResultadoAnalisisService) ActualizarResultado(id primitive.ObjectID, model models.ResultadoAnalisis) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	_, err := s.repo.ObtenerResultadoPorID(s.cfg, id)
	if err != nil {
		return errors.New("resultado no encontrado")
	}
	return s.repo.ActualizarResultado(s.cfg, id, model)
}
