package services

import (
	"errors"
	"regexp"

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
	ActualizarUsuario(cfg config.Config, id primitive.ObjectID, model models.Usuario) error
	DesactivarUsuario(cfg config.Config, id primitive.ObjectID) error
	ContarEncargadosActivos(cfg config.Config) (int64, error)
}

type UsuarioService struct {
	repo UsuarioRepository
	cfg  config.Config
}

func NewUsuarioService(repo UsuarioRepository, cfg config.Config) UsuarioService {
	return UsuarioService{repo: repo, cfg: cfg}
}

// CrearUsuario valida rol, email, contraseña y crea el usuario con contraseña hasheada.
func (s UsuarioService) CrearUsuario(model models.Usuario) error {
	if model.Rol != models.RolCamionero && model.Rol != models.RolEmpleado && model.Rol != models.RolEncargado {
		return errors.New("rol inválido")
	}

	if err := validarEmail(model.Email); err != nil {
		return err
	}

	// Verificar que el email no esté registrado
	usuarioExistente, _ := s.repo.ObtenerUsuarioPorEmail(s.cfg, model.Email)
	if usuarioExistente != nil {
		return errors.New("el email ya está registrado")
	}

	if err := validarContraseña(model.Contraseña); err != nil {
		return err
	}

	model.Activo = true
	hash, err := utils.HashearPassword(model.Contraseña)
	if err != nil {
		return err
	}
	model.Contraseña = hash

	return s.repo.CrearUsuario(s.cfg, model)
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

// ActualizarUsuario modifica los datos de un usuario. Protege al último encargado del sistema.
func (s UsuarioService) ActualizarUsuario(id primitive.ObjectID, model models.Usuario) error {
	if id.IsZero() {
		return errors.New("ID inválido")
	}

	if model.Rol != "" && model.Rol != models.RolCamionero && model.Rol != models.RolEmpleado && model.Rol != models.RolEncargado {
		return errors.New("rol inválido")
	}

	// Verificar que el usuario exista
	usuarioExistente, err := s.repo.ObtenerUsuarioPorID(s.cfg, id)
	if err != nil {
		return errors.New("usuario no encontrado")
	}

	// Verificar que no sea el último encargado si se cambia el rol
	if model.Rol != "" && model.Rol != usuarioExistente.Rol && usuarioExistente.Rol == models.RolEncargado {
		count, err := s.repo.ContarEncargadosActivos(s.cfg)
		if err != nil {
			return err
		}
		if count <= 1 {
			return errors.New("no se puede cambiar el rol del último encargado del sistema")
		}
	}

	if model.Contraseña != "" {
		if err := validarContraseña(model.Contraseña); err != nil {
			return err
		}
		hash, err := utils.HashearPassword(model.Contraseña)
		if err != nil {
			return err
		}
		model.Contraseña = hash
	}

	return s.repo.ActualizarUsuario(s.cfg, id, model)
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

// validarEmail verifica que el email tenga un formato válido.
func validarEmail(email string) error {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return errors.New("formato de email inválido")
	}
	return nil
}
