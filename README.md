[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/lJx09iDV)

# SecureTrace — App Móvil

App móvil de **seguridad ciudadana**. Permite a los ciudadanos reportar casos
(extorsión, robos, etc.), capturar evidencias y dar seguimiento; los
especialistas y administradores gestionan los casos. Consume el mismo backend
Spring Boot que la web (SecureTrace API).

## Stack

| Capa | Tecnología |
|---|---|
| Framework | **Expo SDK 56** + React Native 0.85 |
| Lenguaje | TypeScript |
| Navegación | React Navigation (native-stack + bottom-tabs) |
| HTTP | Axios (cliente central con interceptores JWT + refresh) |
| Tokens | **expo-secure-store** (Keychain/Keystore, no AsyncStorage) |
| Sensores | expo-camera, expo-location, expo-image-picker, expo-audio |
| Mapas | react-native-maps |
| Estado | Context API (`AuthContext`, `ToastContext`) + custom hooks |

## Cómo correr

```bash
npm install
cp .env.example .env          # edita EXPO_PUBLIC_API_URL con la IP de tu backend
npm start                     # abre Expo; escanea el QR con Expo Go
# o: npm run android / npm run ios
```

> **Importante:** en un dispositivo físico, `EXPO_PUBLIC_API_URL` debe apuntar a
> la **IP LAN** de tu máquina (ej. `http://192.168.1.100:8080`), nunca a
> `localhost` (el teléfono no resuelve `localhost` a tu PC).

## Arquitectura

```
src/
├── api/            # Cliente axios + módulos por entidad
│   ├── client.ts   # baseURL + interceptores (JWT, refresh, cola, auth:logout)
│   ├── auth.ts     # login / register / refresh
│   └── cases.ts    # CRUD + statistics
├── components/
│   ├── ui/         # Design system: Button, Input, Card, Modal, Badge, Screen...
│   ├── ErrorBoundary.tsx
│   └── Placeholder.tsx
├── config/         # env.ts (variables EXPO_PUBLIC_*)
├── contexts/       # AuthContext, ToastContext
├── hooks/          # useAuth, useApi (fetch + loading/error/retry)
├── navigation/     # RootNavigator, AuthStack, AppTabs, CasesStack
├── screens/        # Pantallas por dominio (auth, cases, evidence, profile)
├── services/       # secureStorage (tokens cifrados)
├── theme/          # Colores, spacing, tipografía (paleta "Azules")
├── types/          # Tipos y enums del dominio
└── utils/          # errorMessages (Axios → español)
```

### Contratos del backend a respetar
- Login/refresh devuelven `{ token, refreshToken, user }` (**no** `accessToken`).
- Register devuelve un String y **no** auto-loguea → el contexto registra y luego loguea.
- Paginación = Spring `Page<T>` (`content, totalElements, totalPages, number, size, first, last`).
- Las creaciones exigen ids en el body (`victimId`, `uploadedById`, `authorId`…) desde `user.id`.

## Estado actual (esqueleto en `main`)

✅ Listo y funcional:
- Cliente HTTP con JWT + refresh automático y `secure-store`.
- Auth completo: login y registro con validación, persistencia de sesión.
- Navegación por rol (tabs + stack de casos).
- Dashboard con botón **SOS** (haptics) y estadísticas (`/api/cases/statistics`).
- Lista de casos (GET paginado) con loading/empty/error + retry.
- Perfil con logout. Design system, toasts y ErrorBoundary.

🚧 Pantallas placeholder (las completan las ramas de feature): detalle de caso,
formulario de caso, captura de evidencias.

## División de trabajo (5 ramas)

Ver **[BRANCHES.md](./BRANCHES.md)** para el detalle de cada rama, archivos a
tocar y endpoints. Resumen:

| Rama | Responsabilidad | Rúbrica |
|---|---|---|
| `feature/auth-profile` | Editar perfil, recuperar contraseña, pulir validaciones | 2.4 |
| `feature/cases` | Detalle de caso, formulario crear/editar, mensajes, asignaciones | 2.1 / 2.2 |
| `feature/evidence-sensors` | Cámara + audio + galería + subida S3 (presigned) | **2.3** |
| `feature/dashboard-maps` | Stats reales, GPS (ubicación), mapa, flujo SOS completo | **2.3** |
| `feature/ui-errors` | Pulido del design system, skeletons, manejo de errores/offline | 2.4 |
