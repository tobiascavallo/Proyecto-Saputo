package dto

type LoginRequest struct {
	Email      string `json:"email"`
	Contraseña string `json:"contraseña"`
}
