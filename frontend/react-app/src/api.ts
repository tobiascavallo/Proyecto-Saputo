export async function fetchConToken(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status !== 401) {
    return response;
  }

  // El token expiró — intentamos renovarlo
  const refreshToken = localStorage.getItem("refresh_token");

  const refreshResponse = await fetch(
    "http://localhost:8080/api/v1/auth/refresh",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );

  if (!refreshResponse.ok) {
    // El refresh token también venció — mandamos al login
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  const data = await refreshResponse.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("refresh_token", data.refresh_token);

  // Reintentamos la llamada original con el token nuevo
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${data.token}`,
    },
  });
}
