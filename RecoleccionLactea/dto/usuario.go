package dto

import "github.com/tobiascavallo/RecoleccionLactea/models"

type CrearUsuarioRequest struct {
	Nombre     string `json:"nombre"`
	Apellido   string `json:"apellido"`
	DNI        string `json:"dni"`
	Telefono   string `json:"telefono"`
	Email      string `json:"email"`
	Contrasena string `json:"contrasena"`
	Rol        string `json:"rol"`
}

type ActualizarUsuarioRequest struct {
	Nombre     string `json:"nombre,omitempty"`
	Apellido   string `json:"apellido,omitempty"`
	DNI        string `json:"dni,omitempty"`
	Telefono   string `json:"telefono,omitempty"`
	Email      string `json:"email,omitempty"`
	Contrasena string `json:"contrasena,omitempty"`
	Rol        string `json:"rol,omitempty"`
}

type UsuarioResponse struct {
	ID       string `json:"id"`
	Nombre   string `json:"nombre"`
	Apellido string `json:"apellido"`
	DNI      string `json:"dni"`
	Telefono string `json:"telefono"`
	Email    string `json:"email"`
	Rol      string `json:"rol"`
	Activo   bool   `json:"activo"`
}

func UsuarioToResponse(u models.Usuario) UsuarioResponse {
	return UsuarioResponse{
		ID:       u.ID.Hex(),
		Nombre:   u.Nombre,
		Apellido: u.Apellido,
		DNI:      u.DNI,
		Telefono: u.Telefono,
		Email:    u.Email,
		Rol:      string(u.Rol),
		Activo:   u.Activo,
	}
}

// UsuarioBasicoResponse es una versión reducida de UsuarioResponse (sin
// "activo") pensada para el endpoint /usuario/:id/basico: permite que un
// empleado consulte el nombre de un camionero puntual (por ejemplo, desde el
// detalle de un remito) sin darle acceso al listado completo de usuarios,
// que sigue reservado a encargado.
type UsuarioBasicoResponse struct {
	ID       string `json:"id"`
	Nombre   string `json:"nombre"`
	Apellido string `json:"apellido"`
	DNI      string `json:"dni"`
	Telefono string `json:"telefono"`
	Email    string `json:"email"`
	Rol      string `json:"rol"`
}

func UsuarioToBasicoResponse(u models.Usuario) UsuarioBasicoResponse {
	return UsuarioBasicoResponse{
		ID:       u.ID.Hex(),
		Nombre:   u.Nombre,
		Apellido: u.Apellido,
		DNI:      u.DNI,
		Telefono: u.Telefono,
		Email:    u.Email,
		Rol:      string(u.Rol),
	}
}
