package utils

import (
	"errors"
	"regexp"
)

// validarEmail verifica que el email tenga un formato válido.
func ValidarEmail(email string) error {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return errors.New("formato de email inválido")
	}
	return nil
}
