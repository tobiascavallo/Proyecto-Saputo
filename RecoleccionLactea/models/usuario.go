package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Usuario struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	Nombre     string             `bson:"nombre"`
	Apellido   string             `bson:"apellido"`
	Email      string             `bson:"email"`
	Contraseña string             `bson:"contrasena"`
	Rol        Rol                `bson:"rol"`
	Activo     bool               `bson:"activo"`
}

type Rol string

const (
	RolCamionero Rol = "camionero"
	RolEmpleado  Rol = "empleado"
	RolEncargado Rol = "encargado"
)
