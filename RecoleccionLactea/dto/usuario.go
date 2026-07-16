package dto

import "github.com/tobiascavallo/RecoleccionLactea/models"

type CrearUsuarioRequest struct {
	Nombre     string `json:"nombre"`
	Apellido   string `json:"apellido"`
	Email      string `json:"email"`
	Contrasena string `json:"contrasena"`
	Rol        string `json:"rol"`
}

type ActualizarUsuarioRequest struct {
	Nombre     string `json:"nombre,omitempty"`
	Apellido   string `json:"apellido,omitempty"`
	Email      string `json:"email,omitempty"`
	Contrasena string `json:"contrasena,omitempty"`
	Rol        string `json:"rol,omitempty"`
}

type UsuarioResponse struct {
	ID       string `json:"id"`
	Nombre   string `json:"nombre"`
	Apellido string `json:"apellido"`
	Email    string `json:"email"`
	Rol      string `json:"rol"`
	Activo   bool   `json:"activo"`
}

func UsuarioToResponse(u models.Usuario) UsuarioResponse {
	return UsuarioResponse{
		ID:       u.ID.Hex(),
		Nombre:   u.Nombre,
		Apellido: u.Apellido,
		Email:    u.Email,
		Rol:      string(u.Rol),
		Activo:   u.Activo,
	}
}
