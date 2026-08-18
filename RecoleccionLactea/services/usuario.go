package services

import (
	"errors"
	"regexp"
	"strings"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"github.com/tobiascavallo/RecoleccionLactea/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UsuarioRepository interface {
	CrearUsuario(cfg config.Config, model models.Usuario) error
	ObtenerUsuarios(cfg config.Config) ([]models.Usuario, error)
	ObtenerUsuarioPorID(cfg config.Config, ID primitive.ObjectID) (*models.Usuario, error)
	ObtenerUsuarioPorEmail(cfg config.Config, email string) (*models.Usuario, error)
	ObtenerUsuarioPorDNI(cfg config.Config, dni string) (*models.Usuario, error)
	ActualizarUsuario(cfg config.Config, id primitive.ObjectID, model models.Usuario) error
	DesactivarUsuario(cfg config.Config, id primitive.ObjectID) error
	ActivarUsuario(cfg config.Config, id primitive.ObjectID) error
	ContarEncargadosActivos(cfg config.Config) (int64, error)
}

type UsuarioService struct {
	repo UsuarioRepository
	cfg  config.Config
}

func NewUsuarioService(repo UsuarioRepository, cfg config.Config) UsuarioService {
	return UsuarioService{repo: repo, cfg: cfg}
}

// CrearUsuario valida rol, email, DNI, teléfono y contraseña, y crea el
// usuario con la contraseña hasheada. Devuelve el ID del usuario creado —
// se genera acá (en vez de dejar que Mongo lo asigne en el InsertOne) porque
// el frontend lo necesita enseguida para el flujo de alta de camionero, y
// CrearUsuario no devuelve el documento insertado ni su InsertedID (mismo
// criterio que ya usamos en SolicitudEdicion.CrearSolicitud).
func (s UsuarioService) CrearUsuario(model models.Usuario) (primitive.ObjectID, error) {
	if model.Rol != models.RolCamionero && model.Rol != models.RolEmpleado && model.Rol != models.RolEncargado {
		return primitive.NilObjectID, errors.New("rol inválido")
	}

	if err := utils.ValidarEmail(model.Email); err != nil {
		return primitive.NilObjectID, err
	}

	// Verificar que el email no esté registrado
	usuarioExistente, _ := s.repo.ObtenerUsuarioPorEmail(s.cfg, model.Email)
	if usuarioExistente != nil {
		return primitive.NilObjectID, errors.New("el email ya está registrado")
	}

	if err := validarDNI(model.DNI); err != nil {
		return primitive.NilObjectID, err
	}

	// Verificar que el DNI no esté registrado
	dniExistente, _ := s.repo.ObtenerUsuarioPorDNI(s.cfg, model.DNI)
	if dniExistente != nil {
		return primitive.NilObjectID, errors.New("el DNI ya está registrado")
	}

	if strings.TrimSpace(model.Telefono) == "" {
		return primitive.NilObjectID, errors.New("el teléfono es requerido")
	}

	if err := validarContraseña(model.Contraseña); err != nil {
		return primitive.NilObjectID, err
	}

	model.ID = primitive.NewObjectID()
	model.Activo = true
	hash, err := utils.HashearPassword(model.Contraseña)
	if err != nil {
		return primitive.NilObjectID, err
	}
	model.Contraseña = hash

	if err := s.repo.CrearUsuario(s.cfg, model); err != nil {
		return primitive.NilObjectID, err
	}
	return model.ID, nil
}

// ObtenerUsuarios devuelve todos los usuarios del sistema.
func (s UsuarioService) ObtenerUsuarios() ([]models.Usuario, error) {
	return s.repo.ObtenerUsuarios(s.cfg)
}

// ObtenerUsuarioPorID busca un usuario por su ID. Valida que el ID no sea vacío.
func (s UsuarioService) ObtenerUsuarioPorID(id primitive.ObjectID) (*models.Usuario, error) {
	if id.IsZero() {
		return nil, errors.New("ID inválido")
	}
	return s.repo.ObtenerUsuarioPorID(s.cfg, id)
}

// ActualizarUsuario modifica los datos de un usuario. El rol no se puede
// cambiar acá — ver dto.ActualizarUsuarioRequest.
func (s UsuarioService) ActualizarUsuario(id primitive.ObjectID, model models.Usuario) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}

	// Verificar que el usuario exista
	usuarioExistente, err := s.repo.ObtenerUsuarioPorID(s.cfg, id)
	if err != nil {
		return errors.New("usuario no encontrado")
	}

	// DNI y teléfono son opcionales en una edición — si vienen, se validan
	// igual que en el alta.
	if model.DNI != "" {
		if err := validarDNI(model.DNI); err != nil {
			return err
		}
		dniExistente, _ := s.repo.ObtenerUsuarioPorDNI(s.cfg, model.DNI)
		if dniExistente != nil && dniExistente.ID != id {
			return errors.New("el DNI ya está registrado por otro usuario")
		}
	}

	if model.Telefono != "" && strings.TrimSpace(model.Telefono) == "" {
		return errors.New("el teléfono no puede ser solo espacios")
	}

	// A partir de acá se arma el modelo a guardar fusionando lo nuevo sobre
	// el registro existente — el repositorio hace un $set del struct
	// completo, así que cualquier campo que dejemos en su valor cero (string
	// vacío, "activo" en false) se pisaría en la base. Ver mismo criterio en
	// TamberoService.ActualizarTambero / TamboService.ActualizarTambo.
	if model.Nombre != "" {
		usuarioExistente.Nombre = model.Nombre
	}
	if model.Apellido != "" {
		usuarioExistente.Apellido = model.Apellido
	}
	if model.Email != "" {
		usuarioExistente.Email = model.Email
	}
	if model.DNI != "" {
		usuarioExistente.DNI = model.DNI
	}
	if model.Telefono != "" {
		usuarioExistente.Telefono = model.Telefono
	}
	if model.Contraseña != "" {
		if err := validarContraseña(model.Contraseña); err != nil {
			return err
		}
		hash, err := utils.HashearPassword(model.Contraseña)
		if err != nil {
			return err
		}
		usuarioExistente.Contraseña = hash
	}

	return s.repo.ActualizarUsuario(s.cfg, id, *usuarioExistente)
}

// DesactivarUsuario realiza la baja lógica. No permite desactivar al último encargado activo.
func (s UsuarioService) DesactivarUsuario(id primitive.ObjectID) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}

	// Verificar que el usuario exista
	_, err := s.repo.ObtenerUsuarioPorID(s.cfg, id)
	if err != nil {
		return errors.New("usuario no encontrado")
	}

	// Verificar que no sea el último encargado activo
	usuario, err := s.repo.ObtenerUsuarioPorID(s.cfg, id)
	if err != nil {
		return errors.New("usuario no encontrado")
	}

	if usuario.Rol == models.RolEncargado {
		count, err := s.repo.ContarEncargadosActivos(s.cfg)
		if err != nil {
			return err
		}
		if count <= 1 {
			return errors.New("no se puede desactivar al último encargado del sistema")
		}
	}

	return s.repo.DesactivarUsuario(s.cfg, id)
}

// ActivarUsuario revierte una baja lógica. No hay invariantes que proteger acá
// (a diferencia de Desactivar, que no puede dejar el sistema sin encargados) —
// el DNI y el email de un usuario dado de baja siguen reservados aunque esté
// inactivo, así que no hay riesgo de colisión al reactivarlo.
func (s UsuarioService) ActivarUsuario(id primitive.ObjectID) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}
	if _, err := s.repo.ObtenerUsuarioPorID(s.cfg, id); err != nil {
		return errors.New("usuario no encontrado")
	}
	return s.repo.ActivarUsuario(s.cfg, id)
}

// validarDNI verifica que el DNI tenga 7 u 8 dígitos numéricos (formato argentino).
func validarDNI(dni string) error {
	dniLimpio := strings.TrimSpace(dni)
	if !regexp.MustCompile(`^[0-9]{7,8}$`).MatchString(dniLimpio) {
		return errors.New("el DNI debe tener 7 u 8 dígitos numéricos")
	}
	return nil
}

// validarContraseña verifica que la contraseña cumpla los requisitos mínimos de seguridad.
func validarContraseña(contraseña string) error {
	if len(contraseña) < 8 {
		return errors.New("la contraseña debe tener al menos 8 caracteres")
	}

	tieneMayuscula := regexp.MustCompile(`[A-Z]`).MatchString(contraseña)
	if !tieneMayuscula {
		return errors.New("la contraseña debe tener al menos una mayúscula")
	}

	tieneNumero := regexp.MustCompile(`[0-9]`).MatchString(contraseña)
	if !tieneNumero {
		return errors.New("la contraseña debe tener al menos un número")
	}

	tieneEspecial := regexp.MustCompile(`[!@#$%^&*]`).MatchString(contraseña)
	if !tieneEspecial {
		return errors.New("la contraseña debe tener al menos un carácter especial (!@#$%^&*)")
	}

	return nil
}
