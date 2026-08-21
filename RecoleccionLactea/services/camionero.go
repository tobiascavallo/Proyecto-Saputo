package services

import (
	"errors"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CamioneroRepository interface {
	CrearCamionero(cfg config.Config, model models.Camionero) error
	ObtenerCamioneros(cfg config.Config) ([]models.Camionero, error)
	ObtenerCamioneroPorID(cfg config.Config, id primitive.ObjectID) (*models.Camionero, error)
	ObtenerCamioneroPorUsuarioID(cfg config.Config, usuarioID primitive.ObjectID) (*models.Camionero, error)
	ActualizarCamionero(cfg config.Config, id primitive.ObjectID, model models.Camionero) error
	DesactivarCamionero(cfg config.Config, id primitive.ObjectID) error
	ActivarCamionero(cfg config.Config, id primitive.ObjectID) error
}

// UsuarioRepositoryPorCamionero es el subconjunto de UsuarioRepository que
// necesita este service: validar que el usuario exista y tenga rol camionero
// al crear, y resolver nombre/DNI/teléfono para enriquecer las respuestas.
type UsuarioRepositoryPorCamionero interface {
	ObtenerUsuarioPorID(cfg config.Config, ID primitive.ObjectID) (*models.Usuario, error)
}

// EmpresaTransportistaRepositoryPorCamionero es el subconjunto de
// EmpresaTransportistaRepository que necesita este service — mismo criterio
// que ya usa VehiculoService con EmpresaTransportistaRepositoryPorVehiculo.
type EmpresaTransportistaRepositoryPorCamionero interface {
	ObtenerEmpresaTransportistaPorId(cfg config.Config, id primitive.ObjectID) (models.EmpresaTransportista, error)
}

type CamioneroService struct {
	repo        CamioneroRepository
	usuarioRepo UsuarioRepositoryPorCamionero
	empresaRepo EmpresaTransportistaRepositoryPorCamionero
	cfg         config.Config
}

func NewCamioneroService(
	repo CamioneroRepository,
	usuarioRepo UsuarioRepositoryPorCamionero,
	empresaRepo EmpresaTransportistaRepositoryPorCamionero,
	cfg config.Config,
) CamioneroService {
	return CamioneroService{repo: repo, usuarioRepo: usuarioRepo, empresaRepo: empresaRepo, cfg: cfg}
}

// CrearCamionero valida que el usuario exista y tenga rol camionero (no se
// puede cargar, por ejemplo, la empresa transportista de un encargado), que
// la empresa transportista exista, y que ese usuario no tenga ya un registro
// de camionero cargado — la relación es uno a uno, "completar datos" es un
// paso que se hace una sola vez por usuario.
func (s CamioneroService) CrearCamionero(model models.Camionero) error {
	if model.UsuarioID.IsZero() {
		return errors.New("usuario requerido")
	}

	usuario, err := s.usuarioRepo.ObtenerUsuarioPorID(s.cfg, model.UsuarioID)
	if err != nil {
		return errors.New("el usuario no existe")
	}
	if usuario.Rol != models.RolCamionero {
		return errors.New("el usuario indicado no tiene rol camionero")
	}

	if model.EmpresaTransportistaID.IsZero() {
		return errors.New("empresa transportista requerida")
	}
	if _, err := s.empresaRepo.ObtenerEmpresaTransportistaPorId(s.cfg, model.EmpresaTransportistaID); err != nil {
		return errors.New("la empresa transportista no existe")
	}

	existente, _ := s.repo.ObtenerCamioneroPorUsuarioID(s.cfg, model.UsuarioID)
	if existente != nil {
		return errors.New("este usuario ya tiene datos de camionero cargados")
	}

	model.Activo = true
	return s.repo.CrearCamionero(s.cfg, model)
}

// ObtenerCamioneros devuelve todos los registros de datos de camioneros.
func (s CamioneroService) ObtenerCamioneros() ([]models.Camionero, error) {
	return s.repo.ObtenerCamioneros(s.cfg)
}

// ObtenerCamioneroPorID busca un registro de camionero por su propio ID.
func (s CamioneroService) ObtenerCamioneroPorID(id primitive.ObjectID) (*models.Camionero, error) {
	if id.IsZero() {
		return nil, errors.New("ID inválido")
	}
	return s.repo.ObtenerCamioneroPorID(s.cfg, id)
}

// ObtenerCamioneroPorUsuarioID busca el registro de camionero asociado a un
// usuario puntual. Se usa desde el frontend web para completar el detalle de
// un camionero (empresa transportista) a partir de su usuario_id — por
// ejemplo, desde el modal de NombreUsuario.tsx en Remitos o Solicitudes de
// edición — y desde la app móvil, para que el propio camionero resuelva su
// empresa transportista al iniciar un recorrido.
//
// Si quien pregunta es camionero, usuarioID tiene que ser el suyo — evita
// que consulte la empresa de otro camionero cambiando el ID en la URL.
// Mismo patrón que RemitoService.ObtenerRemitoPorID.
func (s CamioneroService) ObtenerCamioneroPorUsuarioID(usuarioID primitive.ObjectID, rolUsuario string, usuarioIDToken primitive.ObjectID) (*models.Camionero, error) {
	if usuarioID.IsZero() {
		return nil, errors.New("ID de usuario inválido")
	}
	if rolUsuario == string(models.RolCamionero) && usuarioID != usuarioIDToken {
		return nil, errors.New("no tenés permiso para ver los datos de otro camionero")
	}
	camionero, err := s.repo.ObtenerCamioneroPorUsuarioID(s.cfg, usuarioID)
	if err != nil {
		return nil, errors.New("el camionero no tiene datos completados")
	}
	return camionero, nil
}

// ActualizarCamionero solo permite reasignar la empresa transportista — el
// usuario asociado no cambia (ver dto.ActualizarCamioneroRequest).
func (s CamioneroService) ActualizarCamionero(id primitive.ObjectID, model models.Camionero) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	if _, err := s.repo.ObtenerCamioneroPorID(s.cfg, id); err != nil {
		return errors.New("camionero no encontrado")
	}
	if model.EmpresaTransportistaID.IsZero() {
		return errors.New("empresa transportista requerida")
	}
	if _, err := s.empresaRepo.ObtenerEmpresaTransportistaPorId(s.cfg, model.EmpresaTransportistaID); err != nil {
		return errors.New("la empresa transportista no existe")
	}
	return s.repo.ActualizarCamionero(s.cfg, id, model)
}

// DesactivarCamionero realiza la baja lógica. El usuario asociado no se ve
// afectado — sigue existiendo como usuario, solo pierde sus datos de
// camionero vigentes (podrá completarlos de nuevo más adelante).
func (s CamioneroService) DesactivarCamionero(id primitive.ObjectID) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	if _, err := s.repo.ObtenerCamioneroPorID(s.cfg, id); err != nil {
		return errors.New("camionero no encontrado")
	}
	return s.repo.DesactivarCamionero(s.cfg, id)
}

// ActivarCamionero revierte una baja lógica. ObtenerCamioneroPorUsuarioID
// solo mira registros activos (mismo criterio que CrearCamionero usa para
// la unicidad 1 a 1 con el usuario) — si mientras este camionero estaba
// desactivado se completaron datos nuevos para el mismo usuario, reactivar
// dejaría dos registros activos para el mismo usuario_id. Se rechaza en ese caso.
func (s CamioneroService) ActivarCamionero(id primitive.ObjectID) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	camionero, err := s.repo.ObtenerCamioneroPorID(s.cfg, id)
	if err != nil {
		return errors.New("camionero no encontrado")
	}
	existente, _ := s.repo.ObtenerCamioneroPorUsuarioID(s.cfg, camionero.UsuarioID)
	if existente != nil && existente.ID != id {
		return errors.New("este usuario ya tiene otro registro de camionero activo")
	}
	return s.repo.ActivarCamionero(s.cfg, id)
}

// ObtenerDatosUsuario resuelve nombre completo, DNI y teléfono de un usuario
// en una sola consulta, para enriquecer las respuestas de camionero sin
// exponer el usuario_id crudo. Si no se pudo resolver (usuario borrado, ID
// inválido, etc.) devuelve cadenas vacías en vez de fallar todo el listado
// por un dato de referencia faltante.
func (s CamioneroService) ObtenerDatosUsuario(usuarioID primitive.ObjectID) (nombre string, dni string, telefono string, email string) {
	usuario, err := s.usuarioRepo.ObtenerUsuarioPorID(s.cfg, usuarioID)
	if err != nil {
		return "", "", "", ""
	}
	return usuario.Nombre + " " + usuario.Apellido, usuario.DNI, usuario.Telefono, usuario.Email
}

// ObtenerNombreEmpresa resuelve el nombre de una empresa transportista para
// enriquecer las respuestas de camionero. Devuelve cadena vacía si no se
// pudo resolver.
func (s CamioneroService) ObtenerNombreEmpresa(empresaID primitive.ObjectID) string {
	empresa, err := s.empresaRepo.ObtenerEmpresaTransportistaPorId(s.cfg, empresaID)
	if err != nil {
		return ""
	}
	return empresa.Nombre
}
