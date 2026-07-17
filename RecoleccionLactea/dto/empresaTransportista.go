package dto

import (
	"github.com/tobiascavallo/RecoleccionLactea/models"
)

type EmpresaTransportistaRequestDTO struct {
    Nombre    string `json:"nombre"`
    Cuit      string `json:"cuit"`
    Domicilio string `json:"domicilio"`
}

type EmpresaTransportistaUpdateDTO struct {
    Nombre    *string `json:"nombre,omitempty"`
    Cuit      *string `json:"cuit,omitempty"`
    Domicilio *string `json:"domicilio,omitempty"`
}

type EmpresaTransportistaResponseDTO struct {
    ID        string `json:"id"`
    Nombre    string `json:"nombre"`
    Cuit      string `json:"cuit"`
    Domicilio string `json:"domicilio"`
    Activo    bool   `json:"activo"`
}

func EmpresaTransportistaRequestToModel(req EmpresaTransportistaRequestDTO) (models.EmpresaTransportista, error) {
    return models.EmpresaTransportista{
        Nombre:    req.Nombre,
        Cuit:      req.Cuit,
        Domicilio: req.Domicilio,
    }, nil
}

func EmpresaTransportistaUpdateToModel(req EmpresaTransportistaUpdateDTO) (models.EmpresaTransportista, error) {
    model := models.EmpresaTransportista{}
    if req.Nombre != nil {
        model.Nombre = *req.Nombre
    }
    if req.Cuit != nil {
        model.Cuit = *req.Cuit
    }
    if req.Domicilio != nil {
        model.Domicilio = *req.Domicilio
    }
    return model, nil
}

func EmpresaTransportistaToResponse(model models.EmpresaTransportista) EmpresaTransportistaResponseDTO {
    return EmpresaTransportistaResponseDTO{
        ID:        model.ID.Hex(),
        Nombre:    model.Nombre,
        Cuit:      model.Cuit,
        Domicilio: model.Domicilio,
        Activo:    model.Activo,
    }
}