package services

import (
	"errors"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"github.com/tobiascavallo/RecoleccionLactea/utils"
)

type AuthRepository interface {
	ObtenerUsuarioPorEmail(cfg config.Config, email string) (*models.Usuario, error)
}

type AuthService struct {
	repo AuthRepository
	cfg  config.Config
}

func NewAuthService(repo AuthRepository, cfg config.Config) AuthService {
	return AuthService{repo: repo, cfg: cfg}
}

// Login verifica las credenciales del usuario y devuelve un token JWT si son correctas.
// Valida que el usuario exista, esté activo y que la contraseña coincida con el hash guardado.
func (s AuthService) Login(email string, contraseña string) (string, error) {
	usuario, err := s.repo.ObtenerUsuarioPorEmail(s.cfg, email)
	if err != nil {
		return "", err
	}

	if !usuario.Activo {
		return "", errors.New("usuario inactivo")
	}

	valido, err := utils.VerificarPassword(usuario.Contraseña, contraseña)
	if err != nil || !valido {
		return "", errors.New("contraseña incorrecta")
	}

	token, err := utils.GenerarToken(usuario.ID, usuario.Rol)
	if err != nil {
		return "", err
	}
	return token, nil
}
