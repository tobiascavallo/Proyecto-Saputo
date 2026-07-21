package utils

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// validarEmail verifica que el email tenga un formato válido.
func ValidarEmail(email string) error {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return errors.New("formato de email inválido")
	}
	return nil
}

func ValidarCuitPersona(cuitRaw string) (bool, error) {
	cuitLimpio := strings.TrimSpace(cuitRaw)
	if cuitLimpio == "" {
		return false, fmt.Errorf("el CUIT no puede estar vacío")
	}

	cuitLimpio = strings.ReplaceAll(cuitLimpio, "-", "")
	cuitLimpio = strings.ReplaceAll(cuitLimpio, " ", "")

	if len(cuitLimpio) != 11 {
		return false, fmt.Errorf("el CUIT debe tener exactamente 11 dígitos")
	}

	_, err := strconv.ParseUint(cuitLimpio, 10, 64)
	if err != nil {
		return false, fmt.Errorf("el CUIT solo debe contener números y guiones")
	}

	prefijo := cuitLimpio[:2]
	if prefijo != "20" && prefijo != "27" && prefijo != "23" {
		return false, fmt.Errorf("el CUIT no pertenece a una persona física (debe empezar con 20, 23 o 27)")
	}

	factores := []int{2, 3, 4, 5, 6, 7, 2, 3, 4, 5}
	suma := 0
	for i := 0; i < 10; i++ {
		digito, _ := strconv.Atoi(string(cuitLimpio[9-i]))
		suma += digito * factores[i]
	}

	resultadoMod := suma % 11
	digitoCalculado := 11 - resultadoMod
	if digitoCalculado == 11 {
		digitoCalculado = 0
	} else if digitoCalculado == 10 {
		return false, fmt.Errorf("CUIT inválido (resultado del dígito verificador inconsistente)")
	}

	digitoReal, _ := strconv.Atoi(string(cuitLimpio[10]))
	if digitoCalculado != digitoReal {
		return false, fmt.Errorf("el CUIT es inválido (el dígito verificador no coincide)")
	}

	return true, nil
}
