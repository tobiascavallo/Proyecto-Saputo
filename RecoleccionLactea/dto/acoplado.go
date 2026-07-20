package dto

import (
	"errors"

	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CrearAcopladoRequest struct {
	Patente                string `json:"patente"`
	HabilitacionSenasa     string `json:"habilitacion_senasa"`
	Tipo                   string `json:"tipo"`
	EmpresaTransportistaID string `json:"empresa_transportista_id"`
}

type ActualizarAcopladoRequest struct {
	Patente                string  `json:"patente,omitempty"`
	HabilitacionSenasa     string  `json:"habilitacion_senasa,omitempty"`
	Tipo                   string  `json:"tipo,omitempty"`
	EmpresaTransportistaID *string `json:"empresa_transportista_id,omitempty"`
}

type AcopladoResponse struct {
	ID                     string `json:"id"`
	Patente                string `json:"patente"`
	HabilitacionSenasa     string `json:"habilitacion_senasa"`
	Tipo                   string `json:"tipo"`
	EmpresaTransportistaID string `json:"empresa_transportista_id"`
	Activo                 bool   `json:"activo"`
}

func CrearAcopladoRequestToModel(req CrearAcopladoRequest) (models.Acoplado, error) {
	empresaID, err := primitive.ObjectIDFromHex(req.EmpresaTransportistaID)
	if err != nil {
		return models.Acoplado{}, errors.New("ID de empresa inválido")
	}
	return models.Acoplado{
		Patente:                req.Patente,
		HabilitacionSenasa:     req.HabilitacionSenasa,
		Tipo:                   models.TipoAcoplado(req.Tipo),
		EmpresaTransportistaID: empresaID,
	}, nil
}

func ActualizarAcopladoRequestToModel(req ActualizarAcopladoRequest) (models.Acoplado, error) {
	acoplado := models.Acoplado{
		Patente:            req.Patente,
		HabilitacionSenasa: req.HabilitacionSenasa,
		Tipo:               models.TipoAcoplado(req.Tipo),
	}
	if req.EmpresaTransportistaID != nil {
		empresaID, err := primitive.ObjectIDFromHex(*req.EmpresaTransportistaID)
		if err != nil {
			return models.Acoplado{}, errors.New("ID de empresa inválido")
		}
		acoplado.EmpresaTransportistaID = empresaID
	}
	return acoplado, nil
}

func AcopladoToResponse(a models.Acoplado) AcopladoResponse {
	return AcopladoResponse{
		ID:                     a.ID.Hex(),
		Patente:                a.Patente,
		HabilitacionSenasa:     a.HabilitacionSenasa,
		Tipo:                   string(a.Tipo),
		EmpresaTransportistaID: a.EmpresaTransportistaID.Hex(),
		Activo:                 a.Activo,
	}
}
