package dto

type LoginRequest struct {
	Email      string `json:"email"`
	Contraseña string `json:"contrasena"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}
