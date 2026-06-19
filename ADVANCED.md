# DevPath — Guía Avanzada de Angular

![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Nivel](https://img.shields.io/badge/nivel-avanzado-FF6B35)

Continuación de la [Guía base → README.md](./README.md). Cada módulo asume que dominas los conceptos del curso anterior y profundiza en patrones usados en aplicaciones Angular de producción.

---

## Índice

11. [HTTP real e interceptores](#11-http-real-e-interceptores)

---

## 11. HTTP real e interceptores

### ¿Por qué reemplazar los datos mock?

La app del curso base cargaba los cursos con datos hardcodeados directamente dentro del servicio:

```typescript
// ❌ Antes — datos inventados dentro del servicio
private readonly allCourses$ = new BehaviorSubject<Course[]>(MOCK_COURSES);
```

En una aplicación real los datos vienen de un servidor. Angular incluye `HttpClient`, un cliente HTTP tipado que devuelve `Observable` y se integra de forma natural con el ecosistema reactivo que ya conocemos.

```typescript
// ✅ Ahora — petición HTTP real
private readonly allCourses$ = this.http.get<Course[]>('/api/courses').pipe(
  shareReplay(1)
);
```

**El resto del servicio no cambia**: el `BehaviorSubject` de filtros, el `combineLatest` y el `applyFilters` siguen exactamente igual. Solo cambia el origen del dato.

### Registrar `HttpClient` en la aplicación

`HttpClient` no está disponible por defecto. Se registra en `app.config.ts` con `provideHttpClient()`:

```typescript
// app.config.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, mockApiInterceptor])
    ),
  ],
};
```

`withInterceptors([...])` encadena los interceptores en el orden declarado. Ese orden importa — lo veremos en detalle más adelante.

### `shareReplay(1)` — caché de la respuesta HTTP

Un `Observable` devuelto por `HttpClient` es **frío**: si hay varios suscriptores, cada uno lanzaría su propia petición HTTP.

```typescript
// Sin shareReplay — dos peticiones al servidor
this.allCourses$.subscribe(...); // petición 1
this.allCourses$.subscribe(...); // petición 2
```

`shareReplay(1)` convierte el Observable en **caliente** y guarda en caché el último valor emitido. El primer suscriptor dispara la petición; todos los siguientes reciben el resultado ya cacheado.

```typescript
// course.ts
private readonly allCourses$ = this.http.get<Course[]>('/api/courses').pipe(
  shareReplay(1)   // una sola petición HTTP, resultado compartido con todos
);
```

| | Sin `shareReplay` | Con `shareReplay(1)` |
|---|---|---|
| Peticiones HTTP | Una por suscriptor | Una para todos |
| Resultado | Independiente por suscriptor | Compartido y cacheado |
| Cuándo usarlo | Streams que cambian frecuentemente | Datos de solo lectura (catálogos, configs) |

### ¿Qué es un interceptor?

Un interceptor es una función que se ejecuta **para cada petición HTTP**, tanto al salir *(request)* como al entrar *(response)*. Permite añadir comportamiento transversal sin tocar cada servicio individualmente.

```text
Componente
    ↓  http.get('/api/courses')
authInterceptor      ← añade cabecera Authorization
    ↓
errorInterceptor     ← envuelve respuesta con catchError
    ↓
mockApiInterceptor   ← intercepta y devuelve datos mock (sin llegar al servidor)
    ↓
  [Servidor real — si el mock no intercepta]
    ↑
mockApiInterceptor   ← respuesta fluye de vuelta
    ↑
errorInterceptor     ← si hay error HTTP, lo gestiona aquí
    ↑
authInterceptor
    ↑
Componente recibe el Observable con los datos
```

### `HttpInterceptorFn` — el interceptor funcional moderno

Desde Angular 15, los interceptores son **funciones**, no clases. La firma es siempre la misma:

```typescript
export const miInterceptor: HttpInterceptorFn = (req, next) => {
  // req  → la petición HTTP entrante (inmutable)
  // next → función para pasar la petición al siguiente interceptor
  return next(req);
};
```

Para modificar la petición hay que **clonarla** — los objetos `HttpRequest` son inmutables por diseño, para que los interceptores no puedan interferir entre sí:

```typescript
// ❌ Mutación directa — error de compilación
req.headers.set('Authorization', 'Bearer ...');

// ✅ Clonar con los cambios aplicados
const reqModificado = req.clone({
  setHeaders: { Authorization: `Bearer ${token}` }
});
return next(reqModificado);
```

> [!NOTE]
> `inject()` funciona dentro de los interceptores porque Angular los ejecuta en un **injection context**. Puedes inyectar cualquier servicio exactamente igual que en un componente o guard.

### Los tres interceptores de la app

#### `authInterceptor` — credenciales automáticas

```typescript
// core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const user = auth.currentUser();

  if (user && req.url.startsWith('/api/')) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${user.id}` },
    });
    return next(authReq);
  }

  return next(req);
};
```

**Principio aplicado — DRY:** sin este interceptor, cada servicio tendría que añadir la cabecera `Authorization` en cada llamada. Con él, la autenticación es completamente transparente para `CourseService`, `EnrollmentService` y cualquier servicio que añadamos en el futuro.

Solo añade la cabecera si hay usuario logado **y** la URL empieza por `/api/`. Las peticiones a recursos externos (imágenes, CDN) no reciben el token.

#### `errorInterceptor` — gestión global de errores

```typescript
// core/interceptors/error.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('[Auth] Sesión expirada o no autorizado');
      }
      if (error.status >= 500) {
        console.error('[Server] Error interno del servidor:', error.message);
      }
      return throwError(() => error);
    })
  );
};
```

`throwError(() => error)` es fundamental: el interceptor loguea el problema de forma centralizada, pero **reenvía el error** para que cada componente pueda reaccionar si lo necesita (mostrar un banner, redirigir, etc.).

| Código HTTP | Significado | Acción típica |
|---|---|---|
| 401 | No autorizado / token expirado | Redirigir al login, limpiar sesión |
| 403 | Sin permisos para este recurso | Mostrar mensaje de acceso denegado |
| 404 | Recurso no encontrado | Navegar a página de error |
| 5xx | Error interno del servidor | Log + notificación genérica al usuario |

#### `mockApiInterceptor` — servidor simulado

```typescript
// core/interceptors/mock-api.interceptor.ts
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of } from 'rxjs';
import { MOCK_COURSES } from '../data/courses.data';

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url === '/api/courses') {
    return of(new HttpResponse({ status: 200, body: MOCK_COURSES })).pipe(
      delay(400)
    );
  }

  return next(req);
};
```

Este interceptor **cortocircuita la cadena**: devuelve un Observable con `of()` sin llamar a `next(req)`. La petición nunca llega al servidor real, ni siquiera aparece en la pestaña Network de las DevTools del navegador — todo ocurre en memoria dentro de Angular.

> [!TIP]
> El `delay(400)` simula la latencia de red real. Esto es importante durante el desarrollo: si la UI funciona bien con 400ms de espera, funcionará bien en producción. Sin el delay, la carga parece instantánea y se pueden pasar por alto estados de carga necesarios.

### El orden de los interceptores

```typescript
withInterceptors([authInterceptor, errorInterceptor, mockApiInterceptor])
```

El orden en el array define el orden de ejecución para el **request**. Para la **response**, el orden es el inverso:

```text
REQUEST  →   auth  →  error  →  mock  →  [servidor]
RESPONSE ←   auth  ←  error  ←  mock  ←  [servidor]
```

**¿Por qué este orden concreto?**

- `authInterceptor` va primero porque necesita añadir la cabecera **antes** de que la petición llegue al mock o al servidor.
- `errorInterceptor` va en medio para capturar errores tanto del mock como del servidor real.
- `mockApiInterceptor` va último porque si intercepta, corta la cadena. Si fuera primero, el `authInterceptor` nunca llegaría a añadir la cabecera.

### Por qué no aparece en la pestaña Network

Cuando `mockApiInterceptor` intercepta una petición y devuelve `of(new HttpResponse(...))`, Angular nunca crea una petición de red real. El navegador no sabe que se hizo una "llamada HTTP" porque todo ocurrió dentro del proceso de JavaScript.

Para verificar que el interceptor funciona, lo más directo es añadir un log temporal:

```typescript
if (req.url === '/api/courses') {
  console.log('[MockAPI] Interceptada:', req.url, '| Auth:', req.headers.get('Authorization'));
  return of(new HttpResponse({ status: 200, body: MOCK_COURSES })).pipe(delay(400));
}
```

En la consola verás tanto la URL interceptada como la cabecera `Authorization` que añadió el `authInterceptor` antes.

### Migrar a un servidor real

Cuando el backend esté listo, el único cambio necesario es:

1. Eliminar `mockApiInterceptor` de `withInterceptors([...])`
2. Borrar el archivo `mock-api.interceptor.ts`
3. Actualizar la URL base (tipicamente en `environment.ts`)

```typescript
// src/environments/environment.ts
export const environment = {
  apiUrl: 'https://api.devpath.io'
};

// course.ts — único cambio en el servicio
private readonly allCourses$ = this.http
  .get<Course[]>(`${environment.apiUrl}/courses`)
  .pipe(shareReplay(1));
```

`CatalogPage`, `CourseCard`, `LessonList` y el resto de componentes **no necesitan ningún cambio**. Eso es el valor real del patrón interceptor: la capa de transporte es completamente transparente para la lógica de presentación.

```text
DESARROLLO                         PRODUCCIÓN
─────────────────────────────────  ──────────────────────────────────
withInterceptors([                 withInterceptors([
  authInterceptor,                   authInterceptor,
  errorInterceptor,                  errorInterceptor,
  mockApiInterceptor   ← se quita
])                                 ])

http.get('/api/courses')     →     http.get('https://api.devpath.io/courses')
CourseService sin cambios    →     CourseService sin cambios
```

### Resumen de conceptos aplicados

| Concepto | Qué hace | Archivo |
|---|---|---|
| `provideHttpClient()` | Registra HttpClient en la app | `app.config.ts` |
| `withInterceptors([...])` | Encadena interceptores en orden | `app.config.ts` |
| `HttpInterceptorFn` | Tipo de un interceptor funcional | Cada interceptor |
| `req.clone({})` | Modifica la petición de forma inmutable | `auth.interceptor.ts` |
| `catchError` + `throwError` | Captura y reenvía errores HTTP | `error.interceptor.ts` |
| `of(new HttpResponse(...))` | Crea una respuesta HTTP sintética | `mock-api.interceptor.ts` |
| `shareReplay(1)` | Cachea la respuesta para evitar peticiones duplicadas | `course.ts` |
