package services

import (
	"errors"
	"time"

	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"github.com/tobiascavallo/RecoleccionLactea/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AuthRepository interface {
	GuardarRefreshToken(cfg config.Config, token models.RefreshToken) error
	ObtenerRefreshToken(cfg config.Config, token string) (*models.RefreshToken, error)
	InvalidarRefreshTokensDeUsuario(cfg config.Config, usuarioID primitive.ObjectID) error
	InvalidarRefreshToken(cfg config.Config, token string) error
}

type AuthService struct {
	repo        AuthRepository
	usuarioRepo UsuarioRepository
	cfg         config.Config
}

func NewAuthService(repo AuthRepository, usuarioRepo UsuarioRepository, cfg config.Config) AuthService {
	return AuthService{repo: repo, usuarioRepo: usuarioRepo, cfg: cfg}
}

// Login verifica las credenciales del usuario y devuelve un par de tokens si son correctas.
// Valida que el usuario exista, esté activo y que la contraseña coincida con el hash guardado.
// Genera un token de acceso (24hs) y un refresh token (7 días) que se guarda en MongoDB
// para permitir renovación de sesión y logout real del servidor.
func (s AuthService) Login(email string, contraseña string) (string, string, error) {
	usuario, err := s.usuarioRepo.ObtenerUsuarioPorEmail(s.cfg, email)
	if err != nil {
		return "", "", err
	}

	if !usuario.Activo {
		return "", "", errors.New("usuario inactivo")
	}

	valido, err := utils.VerificarPassword(usuario.Contraseña, contraseña)
	if err != nil || !valido {
		return "", "", errors.New("contraseña incorrecta")
	}

	token, err := utils.GenerarToken(usuario.ID, usuario.Rol)
	if err != nil {
		return "", "", err
	}

	refreshTokenStr, err := utils.GenerarRefreshToken()
	if err != nil {
		return "", "", err
	}

	refreshToken := models.RefreshToken{
		Token:           refreshTokenStr,
		UsuarioID:       usuario.ID,
		Activo:          true,
		FechaExpiracion: time.Now().Add(7 * 24 * time.Hour),
		FechaCreacion:   time.Now(),
	}

	err = s.repo.GuardarRefreshToken(s.cfg, refreshToken)
	if err != nil {
		return "", "", err
	}

	return token, refreshTokenStr, nil
}

// Refresh valida el refresh token, invalida todos los tokens anteriores del usuario
// y genera un par de tokens nuevo. Si el refresh token ya fue usado o expiró, rechaza la solicitud.
func (s AuthService) Refresh(tokenRefresh string) (string, string, error) {
	refreshToken, err := s.repo.ObtenerRefreshToken(s.cfg, tokenRefresh)
	if err != nil {
		return "", "", errors.New("refresh token inválido")
	}

	if !refreshToken.Activo {
		// Token ya usado — posible robo, invalidamos todos los tokens del usuario
		s.repo.InvalidarRefreshTokensDeUsuario(s.cfg, refreshToken.UsuarioID)
		return "", "", errors.New("refresh token ya utilizado")
	}

	if time.Now().After(refreshToken.FechaExpiracion) {
		return "", "", errors.New("refresh token expirado")
	}

	// Invalidamos todos los tokens anteriores
	err = s.repo.InvalidarRefreshTokensDeUsuario(s.cfg, refreshToken.UsuarioID)
	if err != nil {
		return "", "", err
	}

	// Obtenemos el usuario para generar el nuevo token de acceso
	usuario, err := s.usuarioRepo.ObtenerUsuarioPorID(s.cfg, refreshToken.UsuarioID)
	if err != nil {
		return "", "", err
	}

	// Generamos el nuevo par de tokens
	token, err := utils.GenerarToken(usuario.ID, usuario.Rol)
	if err != nil {
		return "", "", err
	}

	nuevoRefreshTokenStr, err := utils.GenerarRefreshToken()
	if err != nil {
		return "", "", err
	}

	nuevoRefreshToken := models.RefreshToken{
		Token:           nuevoRefreshTokenStr,
		UsuarioID:       usuario.ID,
		Activo:          true,
		FechaExpiracion: time.Now().Add(7 * 24 * time.Hour),
		FechaCreacion:   time.Now(),
	}

	err = s.repo.GuardarRefreshToken(s.cfg, nuevoRefreshToken)
	if err != nil {
		return "", "", err
	}

	return token, nuevoRefreshTokenStr, nil
}

func (s AuthService) Logout(tokenRefresh string) error {
	return s.repo.InvalidarRefreshToken(s.cfg, tokenRefresh)
}
