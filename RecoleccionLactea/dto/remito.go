package dto

import (
	"errors"
	"time"

	"github.com/tobiascavallo/RecoleccionLactea/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CrearRemitoRequest struct {
	NumeroRemito           int    `json:"numero_remito"`
	NumeroRecorrido        int    `json:"numero_recorrido"`
	Fecha                  string `json:"fecha"`
	VehiculoID             string `json:"vehiculo_id"`
	AcopladoID             string `json:"acoplado_id,omitempty"`
	EmpresaTransportistaID string `json:"empresa_transportista_id"`
	CreadoOffline          bool   `json:"creado_offline"`
}

type RemitoResponse struct {
	ID                     string `json:"id"`
	NumeroRemito           int    `json:"numero_remito"`
	NumeroRecorrido        int    `json:"numero_recorrido"`
	Fecha                  string `json:"fecha"`
	CamioneroID            string `json:"camionero_id"`
	VehiculoID             string `json:"vehiculo_id"`
	AcopladoID             string `json:"acoplado_id,omitempty"`
	EmpresaTransportistaID string `json:"empresa_transportista_id"`
	EstadoSincronizacion   string `json:"estado_sincronizacion"`
	EstadoRemito           string `json:"estado_remito"`
	CreadoOffline          bool   `json:"creado_offline"`
}

func CrearRemitoRequestToModel(req CrearRemitoRequest) (models.Remito, error) {
	vehiculoID, err := primitive.ObjectIDFromHex(req.VehiculoID)
	if err != nil {
		return models.Remito{}, errors.New("ID de vehículo inválido")
	}

	empresaID, err := primitive.ObjectIDFromHex(req.EmpresaTransportistaID)
	if err != nil {
		return models.Remito{}, errors.New("ID de empresa inválido")
	}

	fecha, err := time.Parse("2006-01-02", req.Fecha)
	if err != nil {
		return models.Remito{}, errors.New("formato de fecha inválido (usar YYYY-MM-DD)")
	}

	remito := models.Remito{
		NumeroRemito:           req.NumeroRemito,
		NumeroRecorrido:        req.NumeroRecorrido,
		Fecha:                  fecha,
		VehiculoID:             vehiculoID,
		EmpresaTransportistaID: empresaID,
		CreadoOffline:          req.CreadoOffline,
	}

	if req.AcopladoID != "" {
		acopladoID, err := primitive.ObjectIDFromHex(req.AcopladoID)
		if err != nil {
			return models.Remito{}, errors.New("ID de acoplado inválido")
		}
		remito.AcopladoID = acopladoID
	}

	return remito, nil
}

func RemitoToResponse(r models.Remito) RemitoResponse {
	response := RemitoResponse{
		ID:                     r.ID.Hex(),
		NumeroRemito:           r.NumeroRemito,
		NumeroRecorrido:        r.NumeroRecorrido,
		Fecha:                  r.Fecha.Format("2006-01-02"),
		CamioneroID:            r.CamioneroID.Hex(),
		VehiculoID:             r.VehiculoID.Hex(),
		EmpresaTransportistaID: r.EmpresaTransportistaID.Hex(),
		EstadoSincronizacion:   string(r.EstadoSincronizacion),
		EstadoRemito:           string(r.EstadoRemito),
		CreadoOffline:          r.CreadoOffline,
	}

	if !r.AcopladoID.IsZero() {
		response.AcopladoID = r.AcopladoID.Hex()
	}

	return response
}
