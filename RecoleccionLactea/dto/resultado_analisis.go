package dto

import (
	"github.com/tobiascavallo/RecoleccionLactea/models"
)

type ActualizarResultadoAnalisisRequest struct {
	Resultado     *string `json:"resultado,omitempty"`
	Observaciones *string `json:"observaciones,omitempty"`
}

type ResultadoAnalisisResponse struct {
	ID                 string `json:"id"`
	LineaRecoleccionID string `json:"linea_recoleccion_id"`
	TipoMuestra        string `json:"tipo_muestra"`
	Resultado          string `json:"resultado"`
	Observaciones      string `json:"observaciones,omitempty"`
	FechaCarga         string `json:"fecha_carga"`
	EncargadoID        string `json:"encargado_id"`
}

func ActualizarResultadoAnalisisRequestToModel(req ActualizarResultadoAnalisisRequest) models.ResultadoAnalisis {
	resultado := models.ResultadoAnalisis{}

	if req.Resultado != nil {
		resultado.Resultado = models.Resultado(*req.Resultado)
	}
	if req.Observaciones != nil {
		resultado.Observaciones = *req.Observaciones
	}

	return resultado
}

func ResultadoAnalisisToResponse(r models.ResultadoAnalisis) ResultadoAnalisisResponse {
	return ResultadoAnalisisResponse{
		ID:                 r.ID.Hex(),
		LineaRecoleccionID: r.LineaRecoleccionID.Hex(),
		TipoMuestra:        string(r.TipoMuestra),
		Resultado:          string(r.Resultado),
		Observaciones:      r.Observaciones,
		FechaCarga:         r.FechaCarga.Format("2006-01-02T15:04:05"),
		EncargadoID:        r.EncargadoID.Hex(),
	}
}
