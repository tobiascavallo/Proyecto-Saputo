import { useState, useEffect } from "react";

function VerCargas() {
  const [cargas, setCargas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCargas() {
      try {
        const response = await fetch("http://localhost:8080/api/cargas", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          setError("Error al obtener las cargas");
          return;
        }

        const data = await response.json();
        setCargas(data);
      } catch (error) {
        setError("Error al conectar con el servidor");
      } finally {
        setCargando(false);
      }
    }

    fetchCargas();
  }, []);

  if (cargando) return <p className="p-4">Cargando...</p>;
  if (error) return <p className="p-4 text-danger">{error}</p>;

  return (
    <div className="p-4">
      <h2 className="mb-4">Ver cargas</h2>
      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th>Remito</th>
            <th>Fecha</th>
            <th>Camionero</th>
            <th>Tambo</th>
            <th>Litros</th>
            <th>Temperatura</th>
            <th>Cisterna</th>
            <th>Hora</th>
            <th>Muestra diaria</th>
            <th>Muestra UFC</th>
          </tr>
        </thead>
        <tbody>
          {cargas.map((carga: any) => (
            <tr key={carga.id}>
              <td>{carga.numero_remito}</td>
              <td>{carga.fecha}</td>
              <td>{carga.camionero}</td>
              <td>{carga.tambo}</td>
              <td>{carga.litros_recibidos}</td>
              <td>{carga.temperatura_celsius}°C</td>
              <td>{carga.numero_cisterna}</td>
              <td>{carga.hora_recoleccion}</td>
              <td>{carga.codigo_muestra_diaria}</td>
              <td>{carga.codigo_muestra_ufc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VerCargas;
