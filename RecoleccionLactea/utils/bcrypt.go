package utils

import "golang.org/x/crypto/bcrypt"

func HashearPassword(contraseña string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(contraseña), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func VerificarPassword(hash string, contraseña string) (bool, error) {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(contraseña))
	if err != nil {
		return false, err
	}
	return true, nil
}
