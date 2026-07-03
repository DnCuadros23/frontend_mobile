# Plan de Ramas — SecureTrace Mobile

El esqueleto vive en `main` y **ya compila y corre**. Cada integrante trabaja en
una rama y abre PR a `main`. Las ramas están pensadas para tocar archivos
distintos y minimizar conflictos.

## Flujo de trabajo

```bash
git checkout main && git pull
git checkout feature/<tu-rama>          # las ramas ya están creadas
# ...trabaja...
git add -A && git commit -m "feat: ..."
git push -u origin feature/<tu-rama>
# Abre PR hacia main en GitHub
```

> Reglas: no commitees `.env` (ya está en `.gitignore`). Reusa el design system
> de `src/components/ui` y el hook `useApi` en vez de duplicar `try/catch`.
> Nombres en inglés para variables/funciones/componentes.

---

## 1. `feature/auth-profile` — Autenticación y perfil
**Rúbrica:** 2.4 (manejo de errores/validaciones)

- `src/screens/profile/ProfileScreen.tsx`: agregar **editar perfil** (nombre,
  teléfono, alias) y cambio de contraseña.
- Pulir validaciones de `LoginScreen` / `RegisterScreen` (mensajes de error,
  estados de carga, deshabilitar botón en submit — ya hay base).
- Endpoint sugerido: `GET /api/users/me`, y el de actualización de usuario
  cuando el backend lo exponga.
- Mantener tokens en `secureStorage`. No tocar el cliente axios.

## 2. `feature/cases` — Gestión de casos
**Rúbrica:** 2.1 (consumo de API) / 2.2 (arquitectura)

- `src/screens/cases/CaseDetailScreen.tsx`: info del caso + acciones
  editar/eliminar (usar `ConfirmModal`).
- `src/screens/cases/CaseFormScreen.tsx`: crear/editar (detecta `route.params?.id`).
  Al crear, `victimId = user.id`. Selector de prioridad.
- Crear `src/api/messages.ts` y `src/api/assignments.ts` (espejo de `cases.ts`).
- Componentes nuevos en `src/components/cases/`: `MessageThread`, `AssignmentSection`.
- Hook sugerido: `src/hooks/useCases.ts` (paginación centralizada).
- Endpoints: `GET/POST/PUT/DELETE /api/cases`, `PATCH /priority`,
  `/api/messages/case/:id`, `/api/assignments/case/:id`.

## 3. `feature/evidence-sensors` — Evidencias + sensores ⭐
**Rúbrica:** 2.3 (sensores — **clave**, 1.5 pts)

- `src/screens/evidence/EvidenceScreen.tsx`: capturar evidencia.
  - **Cámara** (`expo-camera`): foto y video.
  - **Micrófono** (`expo-audio`): grabar audio.
  - **Galería** (`expo-image-picker`): fallback para adjuntar.
- Manejo de **permisos** con mensajes claros y fallback si se deniegan.
- Flujo de subida S3 (`src/api/evidence.ts`):
  1. `POST /api/evidence/presigned-url` → `{ presignedUrl, fileKey }`.
  2. `PUT` del archivo directo a `presignedUrl`.
  3. `POST /api/evidence` con `{ caseId, uploadedById, type, originalName, fileUrl, fileKey, sizeBytes }`.
- Integrar la lista de evidencias en `CaseDetailScreen` (coordinar con rama 2).

## 4. `feature/dashboard-maps` — Dashboard, GPS y mapas ⭐
**Rúbrica:** 2.3 (segundo sensor + API externa)

- `src/screens/HomeScreen.tsx`: ya consume `/api/cases/statistics`. Agregar
  contadores por prioridad y casos recientes.
- **Ubicación** (`expo-location`, segundo sensor): obtener coordenadas para el
  flujo SOS y para reportar dónde ocurrió el incidente.
- **Mapa** (`react-native-maps` o API externa de mapas estáticos): mostrar
  ubicación aproximada del caso/incidente (ver la maqueta "Ubicación aproximada").
- Completar el flujo **SOS**: al confirmar, crear caso `CRITICAL` con la
  ubicación y notificar (hoy solo muestra un toast).

## 5. `feature/ui-errors` — UI/UX y manejo de errores
**Rúbrica:** 2.4 (errores, estados de carga, feedback)

- Ampliar `src/components/ui/`: `Skeleton` (loaders), `Select`/`Textarea`,
  variantes de `Badge`.
- Estados de carga consistentes (skeletons en vez de spinners donde aplique).
- Manejo de **sin conexión** (detectar offline, banner) y **retry logic**.
- Revisar que todas las pantallas usen el design system (no clases sueltas).
- Animaciones sutiles de transición entre pantallas.

---

### Coordinación entre ramas
- Ramas 3 y 4 cubren los **dos sensores** que exige la rúbrica (2.3). Son las
  de mayor peso: priorícenlas.
- Rama 2 (casos) es la columna vertebral; ramas 3 y 4 se integran en su detalle.
- Eviten editar `src/api/client.ts`, `src/contexts/`, `src/theme/` y
  `src/navigation/` salvo coordinación previa (son compartidos).
