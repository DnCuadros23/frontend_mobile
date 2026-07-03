
import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Sin respuesta del servidor (red caída, timeout, backend apagado).
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'La solicitud tardó demasiado. Revisa tu conexión e inténtalo de nuevo.';
      }
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }

    const { status, data } = error.response;
    const payload = data as
      | { error?: string; message?: string; errors?: Record<string, string> }
      | undefined;

    // Errores de validación de campos.
    if (payload?.errors) {
      const first = Object.values(payload.errors)[0];
      if (first) return first;
    }

    if (payload?.error) return payload.error;
    if (payload?.message) return payload.message;

    switch (status) {
      case 400:
        return 'Datos inválidos. Revisa el formulario.';
      case 401:
        return 'Credenciales inválidas o sesión expirada.';
      case 403:
        return 'No tienes permiso para realizar esta acción.';
      case 404:
        return 'No se encontró el recurso solicitado.';
      case 409:
        return 'Conflicto: el recurso ya existe o está duplicado.';
      case 422:
        return 'El contenido no pudo ser validado.';
      case 500:
        return 'Error interno del servidor. Inténtalo más tarde.';
      default:
        return `Ocurrió un error (código ${status}).`;
    }
  }

  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}
