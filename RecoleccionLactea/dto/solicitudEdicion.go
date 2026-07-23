package dto

import (
	"errors"
	"time"

	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CrearSolicitudEdicionRequest struct {
	LineaRecoleccionID string              `json:"linea_recoleccion_id"`
	ValorActual        ValorRecoleccionDTO `json:"valor_actual"`
	ValorPropuesto     ValorRecoleccionDTO `json:"valor_propuesto"`
	Motivo             string              `json:"motivo"`
}

type ValorRecoleccionDTO struct {
	LitrosRecibidos     float64 `json:"litros_recibidos"`
	TemperaturaCelcius  float64 `json:"temperatura_celcius"`
	NumeroCisterna      int     `json:"numero_cisterna"`
	HoraRecoleccion     string  `json:"hora_recoleccion"`
	CodigoMuestraDiaria string  `json:"codigo_muestra_diaria"`
	CodigoMuestraUFC    string  `json:"codigo_muestra_ufc,omitempty"`
}

type DecisionSolicitudRequest struct {
	Decision string `json:"decision"`
}

type SolicitudEdicionResponse struct {
	ID                 string              `json:"id"`
	LineaRecoleccionID string              `json:"linea_recoleccion_id"`
	CamioneroID        string              `json:"camionero_id"`
	ValorActual        ValorRecoleccionDTO `json:"valor_actual"`
	ValorPropuesto     ValorRecoleccionDTO `json:"valor_propuesto"`
	Motivo             string              `json:"motivo"`
	Estado             string              `json:"estado"`
}

func valorRecoleccionToDTO(v models.ValorRecoleccion) ValorRecoleccionDTO {
	return ValorRecoleccionDTO{
		LitrosRecibidos:     v.LitrosRecibidos,
		TemperaturaCelcius:  v.TemperaturaCelcius,
		NumeroCisterna:      v.NumeroCisterna,
		HoraRecoleccion:     v.HoraRecoleccion.Format("2006-01-02T15:04:05"),
		CodigoMuestraDiaria: v.CodigoMuestraDiaria,
		CodigoMuestraUFC:    v.CodigoMuestraUFC,
	}
}

func valorRecoleccionToModel(v ValorRecoleccionDTO) (models.ValorRecoleccion, error) {
	hora, err := time.Parse("2006-01-02T15:04:05", v.HoraRecoleccion)
	if err != nil {
		return models.ValorRecoleccion{}, errors.New("formato de hora inválido (usar YYYY-MM-DDTHH:MM:SS)")
	}
	return models.ValorRecoleccion{
		LitrosRecibidos:     v.LitrosRecibidos,
		TemperaturaCelcius:  v.TemperaturaCelcius,
		NumeroCisterna:      v.NumeroCisterna,
		HoraRecoleccion:     hora,
		CodigoMuestraDiaria: v.CodigoMuestraDiaria,
		CodigoMuestraUFC:    v.CodigoMuestraUFC,
	}, nil
}

func CrearSolicitudEdicionRequestToModel(req CrearSolicitudEdicionRequest) (models.SolicitudEdicion, error) {
	lineaID, err := primitive.ObjectIDFromHex(req.LineaRecoleccionID)
	if err != nil {
		return models.SolicitudEdicion{}, errors.New("ID de línea de recolección inválido")
	}

	valorActual, err := valorRecoleccionToModel(req.ValorActual)
	if err != nil {
		return models.SolicitudEdicion{}, err
	}

	valorPropuesto, err := valorRecoleccionToModel(req.ValorPropuesto)
	if err != nil {
		return models.SolicitudEdicion{}, err
	}

	return models.SolicitudEdicion{
		LineaRecoleccionID: lineaID,
		ValorActual:        valorActual,
		ValorPropuesto:     valorPropuesto,
		Motivo:             req.Motivo,
	}, nil
}

func SolicitudEdicionToResponse(s models.SolicitudEdicion) SolicitudEdicionResponse {
	return SolicitudEdicionResponse{
		ID:                 s.ID.Hex(),
		LineaRecoleccionID: s.LineaRecoleccionID.Hex(),
		CamioneroID:        s.CamioneroID.Hex(),
		ValorActual:        valorRecoleccionToDTO(s.ValorActual),
		ValorPropuesto:     valorRecoleccionToDTO(s.ValorPropuesto),
		Motivo:             s.Motivo,
		Estado:             string(s.Estado),
	}
}
