package dto

import "github.com/tobiascavallo/RecoleccionLactea/models"

type CrearTamboRequestDTO struct {
	NumeroTambo int    `json:"numero_tambo"`
	TamberoID   string `json:"tambero_id"`
}

type ActualizarTamboRequestDTO struct {
	NumeroTambo *int    `json:"numero_tambo"`
	TamberoID   *string `json:"tambero_id"`
}

type TamboResponseDTO struct {
	ID          string `json:"id"`
	NumeroTambo int    `json:"numero_tambo"`
	TamberoID   string `json:"tambero_id"`
	Activo      bool   `json:"activo"`
}

func TamboToResponse(u models.Tambo) TamboResponseDTO {
	return TamboResponseDTO{
		ID:          u.ID.Hex(),
		NumeroTambo: u.NumeroTambo,
		TamberoID:   u.TamberoID.Hex(),
		Activo:      u.Activo,
	}
}
