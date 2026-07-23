package dto

import (
	"errors"
	"time"

	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CrearLineaRecoleccionRequest struct {
	RemitoID            string  `json:"remito_id"`
	TamboID             string  `json:"tambo_id"`
	LitrosRecibidos     float64 `json:"litros_recibidos"`
	TemperaturaCelcius  float64 `json:"temperatura_celcius"`
	NumeroCisterna      int     `json:"numero_cisterna"`
	HoraRecoleccion     string  `json:"hora_recoleccion"`
	CodigoMuestraDiaria string  `json:"codigo_muestra_diaria"`
	CodigoMuestraUFC    string  `json:"codigo_muestra_ufc,omitempty"`
}

type ActualizarLineaRecoleccionRequest struct {
	LitrosRecibidos     *float64 `json:"litros_recibidos,omitempty"`
	TemperaturaCelcius  *float64 `json:"temperatura_celcius,omitempty"`
	NumeroCisterna      *int     `json:"numero_cisterna,omitempty"`
	HoraRecoleccion     *string  `json:"hora_recoleccion,omitempty"`
	CodigoMuestraDiaria *string  `json:"codigo_muestra_diaria,omitempty"`
	CodigoMuestraUFC    *string  `json:"codigo_muestra_ufc,omitempty"`
}

type LineaRecoleccionResponse struct {
	ID                  string  `json:"id"`
	RemitoID            string  `json:"remito_id"`
	TamboID             string  `json:"tambo_id"`
	LitrosRecibidos     float64 `json:"litros_recibidos"`
	TemperaturaCelcius  float64 `json:"temperatura_celcius"`
	NumeroCisterna      int     `json:"numero_cisterna"`
	HoraRecoleccion     string  `json:"hora_recoleccion"`
	CodigoMuestraDiaria string  `json:"codigo_muestra_diaria"`
	CodigoMuestraUFC    string  `json:"codigo_muestra_ufc,omitempty"`
}

func CrearLineaRecoleccionRequestToModel(req CrearLineaRecoleccionRequest) (models.LineaRecoleccion, error) {
	remitoID, err := primitive.ObjectIDFromHex(req.RemitoID)
	if err != nil {
		return models.LineaRecoleccion{}, errors.New("ID de remito inválido")
	}

	tamboID, err := primitive.ObjectIDFromHex(req.TamboID)
	if err != nil {
		return models.LineaRecoleccion{}, errors.New("ID de tambo inválido")
	}

	horaRecoleccion, err := time.Parse("2006-01-02T15:04:05", req.HoraRecoleccion)
	if err != nil {
		return models.LineaRecoleccion{}, errors.New("formato de hora inválido (usar YYYY-MM-DDTHH:MM:SS)")
	}

	return models.LineaRecoleccion{
		RemitoID:            remitoID,
		TamboID:             tamboID,
		LitrosRecibidos:     req.LitrosRecibidos,
		TemperaturaCelcius:  req.TemperaturaCelcius,
		NumeroCisterna:      req.NumeroCisterna,
		HoraRecoleccion:     horaRecoleccion,
		CodigoMuestraDiaria: req.CodigoMuestraDiaria,
		CodigoMuestraUFC:    req.CodigoMuestraUFC,
	}, nil
}

func ActualizarLineaRecoleccionRequestToModel(req ActualizarLineaRecoleccionRequest) models.LineaRecoleccion {
	linea := models.LineaRecoleccion{}

	if req.LitrosRecibidos != nil {
		linea.LitrosRecibidos = *req.LitrosRecibidos
	}
	if req.TemperaturaCelcius != nil {
		linea.TemperaturaCelcius = *req.TemperaturaCelcius
	}
	if req.NumeroCisterna != nil {
		linea.NumeroCisterna = *req.NumeroCisterna
	}
	if req.HoraRecoleccion != nil {
		horaRecoleccion, err := time.Parse("2006-01-02T15:04:05", *req.HoraRecoleccion)
		if err == nil {
			linea.HoraRecoleccion = horaRecoleccion
		}
	}
	if req.CodigoMuestraDiaria != nil {
		linea.CodigoMuestraDiaria = *req.CodigoMuestraDiaria
	}
	if req.CodigoMuestraUFC != nil {
		linea.CodigoMuestraUFC = *req.CodigoMuestraUFC
	}

	return linea
}

func LineaRecoleccionToResponse(l models.LineaRecoleccion) LineaRecoleccionResponse {
	return LineaRecoleccionResponse{
		ID:                  l.ID.Hex(),
		RemitoID:            l.RemitoID.Hex(),
		TamboID:             l.TamboID.Hex(),
		LitrosRecibidos:     l.LitrosRecibidos,
		TemperaturaCelcius:  l.TemperaturaCelcius,
		NumeroCisterna:      l.NumeroCisterna,
		HoraRecoleccion:     l.HoraRecoleccion.Format("2006-01-02T15:04:05"),
		CodigoMuestraDiaria: l.CodigoMuestraDiaria,
		CodigoMuestraUFC:    l.CodigoMuestraUFC,
	}
}
