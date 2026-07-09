package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/tobiascavallo/RecoleccionLactea/config"
	"github.com/tobiascavallo/RecoleccionLactea/db"
)

func main() {

	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Connect(cfg)
	if err != nil {
		log.Fatal(err)
	}

	r := gin.Default()
	r.Run(":" + cfg.Port)
}
