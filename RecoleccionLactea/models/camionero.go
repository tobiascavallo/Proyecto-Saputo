package models

import "go.mongodb.org/mongo-driver/bson/primitive"

// Camionero guarda los datos específicos del rol camionero (empresa
// transportista, y lo que se sume a futuro: licencia, fecha de ingreso,
// etc.). El acceso (login, JWT, roles) lo sigue manejando Usuario — este
// modelo es 1 a 1 con un Usuario de rol "camionero", pero no todos los
// usuarios camioneros tienen necesariamente un registro acá: completar estos
// datos es un paso aparte, posterior al alta del usuario.
type Camionero struct {
	ID                     primitive.ObjectID `bson:"_id,omitempty"`
	UsuarioID              primitive.ObjectID `bson:"usuario_id"`
	EmpresaTransportistaID primitive.ObjectID `bson:"empresa_transportista_id"`
	Activo                 bool               `bson:"activo"`
}
