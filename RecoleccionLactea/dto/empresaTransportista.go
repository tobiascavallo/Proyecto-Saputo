package dto

import (
	"github.com/tobiascavallo/RecoleccionLactea/models"
	"github.com/tobiascavallo/RecoleccionLactea/utils"
)

type EmpresaTransportistaRequestDTO struct {
	Nombre    string `json:"nombre"`
	Cuit      string `json:"cuit"`
	Domicilio string `json:"domicilio"`
}

type EmpresaTransportistaResponseDTO struct {
	ID        string `json:"id"`
	Nombre    string `json:"nombre"`
	Cuit      string `json:"cuit"`
	Domicilio string `json:"domicilio"`
}

func GetModelEmpresaTransportista(dto *EmpresaTransportistaRequestDTO) *models.EmpresaTransportista {
	return &models.EmpresaTransportista{
		Nombre:    dto.Nombre,
		Cuit:      dto.Cuit,
		Domicilio: dto.Domicilio,
	}
}

func NewEmpresaTransportistaResponseDto(model models.EmpresaTransportista) *EmpresaTransportistaResponseDTO {
	return &EmpresaTransportistaResponseDTO{
		ID:        utils.GetStringIDFromObjectID(model.ID),
		Nombre:    model.Nombre,
		Cuit:      model.Cuit,
		Domicilio: model.Domicilio,
	}
}

func NewEmpresaTransportistaRequestDto(response EmpresaTransportistaResponseDTO) *EmpresaTransportistaRequestDTO {
	return &EmpresaTransportistaRequestDTO{
		Nombre:    response.Nombre,
		Cuit:      response.Cuit,
		Domicilio: response.Domicilio,
	}
}

type EmpresaTransportistaUpdateDTO struct {
	Nombre    *string `json:"nombre,omitempty"`
	Cuit      *string `json:"cuit,omitempty"`
	Domicilio *string `json:"domicilio,omitempty"`
}

func NewEmpresaTransportistaRequestToModel(model models.EmpresaTransportista) *EmpresaTransportistaRequestDTO {
	return &EmpresaTransportistaRequestDTO{
		Nombre:    model.Nombre,
		Cuit:      model.Cuit,
		Domicilio: model.Domicilio,
	}
}
