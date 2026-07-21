package dto

import "github.com/tobiascavallo/RecoleccionLactea/models"

type CrearTamberoRequestDTO struct {
	Nombre   string `json:"nombre"`
	Cuit     string `json:"cuit"`
	Telefono string `json:"telefono"`
	Email    string `json:"email"`
}

type ActualizarTamberoRequestDTO struct {
	Nombre   *string `json:"nombre,omitempty"`
	Cuit     *string `json:"cuit,omitempty"`
	Telefono *string `json:"telefono,omitempty"`
	Email    *string `json:"email,omitempty"`
}

type TamberoResponseDTO struct {
	ID       string `json:"id"`
	Nombre   string `json:"nombre"`
	Cuit     string `json:"cuit"`
	Telefono string `json:"telefono"`
	Email    string `json:"email"`
	Activo   bool   `json:"activo"`
}

func TamberoToResponse(u models.Tambero) TamberoResponseDTO {
	return TamberoResponseDTO{
		ID:       u.ID.Hex(),
		Nombre:   u.Nombre,
		Email:    u.Email,
		Telefono: u.Telefono,
		Cuit:     u.Cuit,
		Activo:   u.Activo,
	}
}
