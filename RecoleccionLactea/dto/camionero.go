package dto

import (
	"errors"

	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CrearCamioneroRequest struct {
	UsuarioID              string `json:"usuario_id"`
	EmpresaTransportistaID string `json:"empresa_transportista_id"`
}

// ActualizarCamioneroRequest solo permite reasignar la empresa transportista
// — el usuario asociado queda fijo (no tiene sentido reasignar de qué
// usuario es el registro; para eso se crea uno nuevo).
type ActualizarCamioneroRequest struct {
	EmpresaTransportistaID string `json:"empresa_transportista_id"`
}

// CamioneroResponse no expone usuario_id ni empresa_transportista_id en
// crudo: trae el nombre del usuario y de la empresa ya resueltos, más DNI y
// teléfono (viven en Usuario, no en Camionero) para que el listado de
// Camioneros no tenga que hacer un segundo pedido a /usuario para mostrarlos.
type CamioneroResponse struct {
	ID                         string `json:"id"`
	UsuarioID                  string `json:"usuario_id"`
	UsuarioNombre              string `json:"usuario_nombre"`
	UsuarioDNI                 string `json:"usuario_dni"`
	UsuarioTelefono            string `json:"usuario_telefono"`
	UsuarioEmail               string `json:"usuario_email"`
	EmpresaTransportistaID     string `json:"empresa_transportista_id"`
	EmpresaTransportistaNombre string `json:"empresa_transportista_nombre"`
	Activo                     bool   `json:"activo"`
}

func ActualizarCamioneroRequestToModel(req ActualizarCamioneroRequest) (models.Camionero, error) {
	empresaID, err := primitive.ObjectIDFromHex(req.EmpresaTransportistaID)
	if err != nil {
		return models.Camionero{}, errors.New("ID de empresa inválido")
	}
	return models.Camionero{EmpresaTransportistaID: empresaID}, nil
}

func CrearCamioneroRequestToModel(req CrearCamioneroRequest) (models.Camionero, error) {
	usuarioID, err := primitive.ObjectIDFromHex(req.UsuarioID)
	if err != nil {
		return models.Camionero{}, errors.New("ID de usuario inválido")
	}

	empresaID, err := primitive.ObjectIDFromHex(req.EmpresaTransportistaID)
	if err != nil {
		return models.Camionero{}, errors.New("ID de empresa inválido")
	}

	return models.Camionero{
		UsuarioID:              usuarioID,
		EmpresaTransportistaID: empresaID,
	}, nil
}

func CamioneroToResponse(c models.Camionero, usuarioNombre string, usuarioDNI string, usuarioTelefono string, usuarioEmail string, empresaNombre string) CamioneroResponse {
	return CamioneroResponse{
		ID:                         c.ID.Hex(),
		UsuarioID:                  c.UsuarioID.Hex(),
		UsuarioNombre:              usuarioNombre,
		UsuarioDNI:                 usuarioDNI,
		UsuarioTelefono:            usuarioTelefono,
		UsuarioEmail:               usuarioEmail,
		EmpresaTransportistaID:     c.EmpresaTransportistaID.Hex(),
		EmpresaTransportistaNombre: empresaNombre,
		Activo:                     c.Activo,
	}
}
