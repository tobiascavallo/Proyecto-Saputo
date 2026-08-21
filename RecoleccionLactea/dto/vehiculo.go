package dto

import (
	"errors"

	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CrearVehiculoRequest struct {
	Patente                string `json:"patente"`
	HabilitacionSenasa     string `json:"habilitacion_senasa"`
	Tipo                   string `json:"tipo"`
	TieneCisternaPropia    bool   `json:"tiene_cisterna_propia"`
	EmpresaTransportistaID string `json:"empresa_transportista_id"`
}

type ActualizarVehiculoRequest struct {
	Patente                string `json:"patente,omitempty"`
	HabilitacionSenasa     string `json:"habilitacion_senasa,omitempty"`
	Tipo                   string `json:"tipo,omitempty"`
	TieneCisternaPropia    *bool  `json:"tiene_cisterna_propia,omitempty"`
	EmpresaTransportistaID string `json:"empresa_transportista_id,omitempty"`
}

type VehiculoResponse struct {
	ID                     string `json:"id"`
	Patente                string `json:"patente"`
	HabilitacionSenasa     string `json:"habilitacion_senasa"`
	Tipo                   string `json:"tipo"`
	TieneCisternaPropia    bool   `json:"tiene_cisterna_propia"`
	EmpresaTransportistaID string `json:"empresa_transportista_id"`
	Activo                 bool   `json:"activo"`
}

func VehiculoToResponse(v models.Vehiculo) VehiculoResponse {
	return VehiculoResponse{
		ID:                     v.ID.Hex(),
		Patente:                v.Patente,
		HabilitacionSenasa:     v.HabilitacionSenasa,
		Tipo:                   string(v.Tipo),
		TieneCisternaPropia:    v.TieneCisternaPropia,
		EmpresaTransportistaID: v.EmpresaTransportistaID.Hex(),
		Activo:                 v.Activo,
	}
}

func CrearVehiculoRequestToModel(req CrearVehiculoRequest) (models.Vehiculo, error) {
	empresaID, err := primitive.ObjectIDFromHex(req.EmpresaTransportistaID)
	if err != nil {
		return models.Vehiculo{}, errors.New("ID de empresa inválido")
	}

	return models.Vehiculo{
		Patente:                req.Patente,
		HabilitacionSenasa:     req.HabilitacionSenasa,
		Tipo:                   models.TipoVehiculo(req.Tipo),
		TieneCisternaPropia:    req.TieneCisternaPropia,
		EmpresaTransportistaID: empresaID,
	}, nil
}

// TieneCisternaPropia no se aplana acá a propósito — viaja como puntero
// directo a VehiculoService.ActualizarVehiculo, para no perder la
// distinción entre "no lo mandaron" y "lo mandaron en false" (ver comentario
// en ese método).
func ActualizarVehiculoRequestToModel(req ActualizarVehiculoRequest) (models.Vehiculo, error) {
	vehiculo := models.Vehiculo{
		Patente:            req.Patente,
		HabilitacionSenasa: req.HabilitacionSenasa,
		Tipo:               models.TipoVehiculo(req.Tipo),
	}

	if req.EmpresaTransportistaID != "" {
		empresaID, err := primitive.ObjectIDFromHex(req.EmpresaTransportistaID)
		if err != nil {
			return models.Vehiculo{}, errors.New("ID de empresa inválido")
		}
		vehiculo.EmpresaTransportistaID = empresaID
	}

	return vehiculo, nil
}
