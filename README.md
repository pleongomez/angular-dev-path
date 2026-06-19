# DevPath — Guía didáctica de Angular moderno

![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Educativo](https://img.shields.io/badge/tipo-educativo-4CAF50)

Proyecto educativo construido con **Angular 22** que implementa una mini-plataforma de aprendizaje online. Cada sección de esta guía cubre un concepto clave del desarrollo Angular moderno, ilustrado con el código real de la aplicación.

---

## Índice

1. [Estructura del proyecto](#1-estructura-del-proyecto)
2. [Lazy Loading y rutas](#2-lazy-loading-y-rutas)
3. [Interfaces TypeScript](#3-interfaces-typescript)
4. [Signals — reactividad moderna](#4-signals--reactividad-moderna)
5. [Servicios y Dependency Injection](#5-servicios-y-dependency-injection)
6. [Route Guards](#6-route-guards)
7. [Programación reactiva con RxJS](#7-programación-reactiva-con-rxjs)
8. [Componentes anidados e Inputs](#8-componentes-anidados-e-inputs)
9. [Signal Forms](#9-signal-forms)
10. [Referencia rápida](#10-referencia-rápida)

---

## 1. Estructura del proyecto

```text
src/app/
├── core/                         # Lógica compartida (no es una pantalla)
│   ├── data/
│   │   └── courses.data.ts       # Datos mock
│   ├── guards/
│   │   └── auth.guard.ts         # Protección de rutas
│   ├── models/                   # Contratos de datos (interfaces)
│   │   ├── course.model.ts
│   │   ├── enrollment.model.ts
│   │   ├── lesson.model.ts
│   │   └── user.model.ts
│   └── services/                 # Lógica de negocio
│       ├── auth.ts
│       ├── course.ts
│       └── enrollment.ts
├── features/                     # Secciones de la app (cada una es independiente)
│   ├── catalog/
│   │   ├── catalog-page/         # Página principal del catálogo
│   │   ├── course-card/          # Tarjeta de curso
│   │   ├── lesson-item/          # Ítem de lección
│   │   └── lesson-list/          # Lista de lecciones (expandible)
│   ├── home/
│   │   └── home-page/            # Página de inicio
│   ├── my-learning/
│   │   └── my-learning-page/     # Mis inscripciones y progreso
│   └── profile/
│       └── profile-page/         # Formulario de perfil
└── layout/                       # Componentes de maquetación
    ├── header/
    └── footer/
```

### ¿Por qué esta estructura?

Se usa **arquitectura por features** (dominio de negocio) en lugar de agrupar por tipo técnico. Comparación:

```text
❌ Por tipo técnico          ✅ Por feature (la que usamos)
components/                  features/
  header/                      catalog/
  footer/                        catalog-page/
  course-card/                   course-card/
services/                      my-learning/
  auth.service.ts                my-learning-page/
  course.service.ts
```

**Ventaja**: todo lo relacionado con "catálogo" vive en `features/catalog/`. Cuando buscas un bug o quieres añadir algo, sabes exactamente dónde ir.

---

## 2. Lazy Loading y rutas

### ¿Qué es el Lazy Loading?

Sin lazy loading, Angular empaqueta toda la app en un único archivo JavaScript que el navegador descarga de golpe. Con lazy loading, cada sección se descarga solo cuando el usuario navega a ella.

```text
Petición a /          → descarga main.js (bundle mínimo, ~100KB)
Navega a /catalog     → descarga chunk-catalog.js (~20KB, solo cuando se necesita)
Navega a /my-learning → descarga chunk-my-learning.js
```

### Configuración en `app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    // Ruta raíz — carga un único componente
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/home/home-page/home-page').then(m => m.HomePage),
  },
  {
    // Catálogo — carga un sub-array de rutas (el feature completo)
    path: 'catalog',
    loadChildren: () =>
      import('./features/catalog/catalog.routes').then(m => m.CATALOG_ROUTES),
  },
  {
    // Ruta protegida — el guard se evalúa ANTES de descargar el chunk
    path: 'my-learning',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/my-learning/my-learning.routes').then(m => m.MY_LEARNING_ROUTES),
  },
  {
    path: '**',       // Wildcard — captura cualquier URL no definida
    redirectTo: '',   // Siempre al final del array
  },
];
```

### `loadComponent` vs `loadChildren`

| | `loadComponent` | `loadChildren` |
|---|---|---|
| **Cuándo usarlo** | Ruta con un único componente | Ruta con sub-rutas propias |
| **Lo que carga** | Un componente | Un array de `Routes` |
| **Ejemplo** | Página de inicio | Todo el feature de catálogo |

### Rutas de un feature (`catalog.routes.ts`)

```typescript
import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',            // Ruta raíz del feature (/catalog)
    loadComponent: () =>
      import('./catalog-page/catalog-page').then(m => m.CatalogPage),
  },
  // Aquí irían sub-rutas como /catalog/:id
];
```

> [!NOTE]
> **Clave:** el `import()` con paréntesis es JavaScript nativo. Es lo que le dice al navegador "descarga este módulo solo cuando lo necesites". Angular y el bundler (esbuild) detectan estos `import()` y crean los chunks automáticamente.

---

## 3. Interfaces TypeScript

### ¿Qué es una interfaz?

Una interfaz es un **contrato de datos**. Define la forma que debe tener un objeto, pero no genera ningún código JavaScript — desaparece completamente en tiempo de compilación.

```typescript
// course.model.ts

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseCategory = 'frontend' | 'backend' | 'devops' | 'mobile';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  imageUrl: string;
  level: CourseLevel;          // Solo acepta estos tres valores exactos
  category: CourseCategory;
  lessons: Lesson[];           // Composición — referencia a otra interfaz
  durationMinutes: number;
  rating: number;
  enrolledCount: number;
}
```

### `interface` vs `class`

```typescript
// ✅ Interface — cero coste en runtime, solo existe en compilación
interface Course { id: string; title: string; }

// ❌ Clase — genera código JS innecesario si solo la usas como tipo
class Course {
  id: string = '';
  title: string = '';
}
```

Usa interfaces para **contratos de datos** (lo que viene de una API, lo que se pasa entre componentes).
Usa clases para objetos que necesitan **lógica y métodos**.

### Union Types para valores acotados

```typescript
// Sin union type — cualquier string es válido (peligroso)
level: string;

// Con union type — TypeScript solo acepta estos valores
type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
level: CourseLevel;

// Si escribes esto, el compilador da error antes de llegar al navegador:
const c: Course = { level: 'expert' }; // ❌ Error de compilación
```

### Composición de interfaces

```typescript
// Enrollment incluye Course completo, no solo su id
export interface Enrollment {
  id: string;
  userId: string;
  course: Course;              // Objeto completo, no solo el id
  enrolledAt: Date;
  completedLessonIds: string[];
  progressPercent: number;     // 0-100
}
```

**¿Por qué embeber el objeto completo en vez de solo el id?**
En la vista de "Mi aprendizaje" necesitamos mostrar título, imagen y nivel del curso. Si guardáramos solo el id, necesitaríamos hacer una segunda consulta. Al embeber el objeto, los datos ya están disponibles.

---

## 4. Signals — reactividad moderna

### ¿Qué es un Signal?

Un Signal es un **contenedor de valor reactivo**. Cuando su valor cambia, Angular sabe exactamente qué partes del DOM necesitan actualizarse, sin necesidad de revisar todo el árbol de componentes.

```typescript
import { signal, computed } from '@angular/core';

// Crear un signal con valor inicial
const count = signal(0);

// Leer su valor (siempre llamándolo como función)
console.log(count());  // 0

// Modificar su valor
count.set(5);          // reemplaza el valor
count.update(v => v + 1);  // modifica basándose en el valor anterior

console.log(count());  // 6
```

### Signals en servicios — encapsulación de estado

El patrón más importante: el estado **privado** solo lo modifica el servicio; el estado **público** solo se puede leer.

```typescript
// auth.ts
@Service()
export class AuthService {
  // ✅ Privado — solo el servicio puede escribir
  private readonly _currentUser = signal<User | null>(this.restoreSession());

  // ✅ Público de solo lectura — cualquier componente puede leer, nadie puede escribir
  readonly currentUser = this._currentUser.asReadonly();

  login(email: string): boolean {
    const user = this.mockUsers.find(u => u.email === email);
    if (user) {
      this._currentUser.set(user);  // ✅ Solo el servicio modifica el estado
      return true;
    }
    return false;
  }
}

// En un componente — intento de modificar desde fuera
const auth = inject(AuthService);
auth.currentUser.set(null); // ❌ Error de TypeScript: set no existe en ReadonlySignal
```

### `computed()` — estado derivado

`computed()` crea un Signal de **solo lectura** que se recalcula automáticamente cuando cambian sus dependencias. Nunca hay que actualizarlo manualmente.

```typescript
// enrollment.ts
@Service()
export class EnrollmentService {
  private readonly _enrollments = signal<Enrollment[]>([...]);

  // Se recalcula automáticamente cuando _enrollments cambia
  readonly totalEnrolled = computed(() => this._enrollments().length);

  readonly averageProgress = computed(() => {
    const list = this._enrollments();
    if (list.length === 0) return 0;
    return Math.round(
      list.reduce((acc, e) => acc + e.progressPercent, 0) / list.length
    );
  });
}
```

> [!TIP]
> **Regla de oro:** si un valor **se puede calcular a partir de otro estado**, usa `computed()` en lugar de mantener una variable separada que tengas que actualizar manualmente.

### Signals en templates

Los templates de Angular son **reactive contexts**: leen los Signals automáticamente y re-renderizan cuando cambian.

```html
<!-- header.html -->

<!-- auth.isAuthenticated() se re-evalúa automáticamente cuando cambia -->
@if (auth.isAuthenticated()) {
  <span>{{ auth.currentUser()?.name }}</span>
  <button (click)="logout()">Cerrar sesión</button>
} @else {
  <button (click)="login()">Iniciar sesión</button>
}
```

### `toSignal()` — puente entre RxJS y Signals

Convierte un `Observable` en un `Signal` para usarlo directamente en templates y `computed()`.

```typescript
// catalog-page.ts
import { toSignal } from '@angular/core/rxjs-interop';

export class CatalogPage {
  private readonly courseService = inject(CourseService);

  // courses$ es un Observable — lo convertimos a Signal
  protected readonly courses = toSignal(
    this.courseService.courses$,
    { initialValue: [] }   // valor mientras el Observable no ha emitido nada
  );
}
```

```html
<!-- En el template, se usa como cualquier Signal -->
@for (course of courses(); track course.id) {
  <app-course-card [course]="course" />
}
```

| | `async` pipe | `toSignal()` |
|---|---|---|
| Dónde vive | Solo en el template | En el componente (TypeScript) |
| Tipo resultante | `T \| null` siempre | `T` con `initialValue` |
| Composable con `computed()` | No | Sí |
| Import necesario | `AsyncPipe` en `imports[]` | Solo el import de función |

---

## 5. Servicios y Dependency Injection

### ¿Qué es un servicio?

Un servicio es una clase que contiene **lógica compartida** entre componentes: llamadas a APIs, gestión de estado, autenticación... Cualquier cosa que no sea "mostrar algo en pantalla".

### `@Service()` — el decorador moderno

```typescript
import { Service } from '@angular/core';

@Service()
export class AuthService {
  // ...
}
```

`@Service()` (Angular 22) equivale al anterior `@Injectable({ providedIn: 'root' })` y hace tres cosas:
- Crea un **singleton** — una única instancia para toda la app
- Lo hace disponible en cualquier componente o servicio **sin configuración extra**
- Permite **tree-shaking** — si nadie lo inyecta, no aparece en el bundle final

### `inject()` — inyección moderna

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth';

export class Header {
  // ✅ Moderno — inject() en field initializer
  protected readonly auth = inject(AuthService);

  // ❌ Antiguo — constructor injection (sigue funcionando pero es más verboso)
  // constructor(private auth: AuthService) {}
}
```

`inject()` puede usarse en:
- Field initializers de componentes, servicios y guards
- Constructor body
- Funciones de guards y resolvers (injection context del router)

### Separación de responsabilidades

```
AuthService       → ¿Quién está conectado? Login / logout
CourseService     → ¿Qué cursos existen? Filtrado y búsqueda
EnrollmentService → ¿A qué cursos está inscrito el usuario? Progreso
```

Ningún servicio conoce los detalles internos de los otros. Los componentes inyectan los que necesitan y los combinan.

---

## 6. Route Guards

### ¿Qué es un guard?

Un guard es una función que el router ejecuta **antes de activar una ruta**. Si devuelve `true`, la navegación continúa. Si devuelve `false` o una URL, la bloquea o redirige.

### `CanActivateFn` — el guard funcional moderno

```typescript
// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;                    // ✅ Permite el acceso
  }

  return router.parseUrl('/');      // 🔄 Redirige a home
};
```

Desde Angular 15, los guards son **funciones**, no clases. Más simples, más testables.

### Aplicar un guard a una ruta

```typescript
// app.routes.ts
{
  path: 'my-learning',
  canActivate: [authGuard],     // ← se evalúa ANTES de cargar el componente
  loadChildren: () => import('./features/my-learning/my-learning.routes')
                        .then(m => m.MY_LEARNING_ROUTES),
}
```

> [!NOTE]
> **Punto clave:** el guard se ejecuta antes de que el lazy loading descargue el chunk. Si el guard bloquea, el código de esa sección **nunca se descarga**.

### `false` vs `router.parseUrl()`

```typescript
return false;                // Bloquea — el usuario se queda sin pantalla
return router.parseUrl('/'); // Redirige — mucho mejor experiencia de usuario
```

`parseUrl()` devuelve un `UrlTree` que el router interpreta como "cancela esta navegación y ve a esta URL en su lugar".

> [!WARNING]
> **Importante:** los guards de cliente **no son seguridad real**. Son para la experiencia de usuario. Siempre valida permisos en el servidor.

---

## 7. Programación reactiva con RxJS

### Conceptos fundamentales

**Observable**: un flujo de valores en el tiempo. Como un array, pero asíncrono.

```typescript
// Un array — todos los valores ya existen
const numeros = [1, 2, 3];

// Un Observable — los valores llegan con el tiempo
const numeros$ = new Observable(observer => {
  observer.next(1);                              // emite 1 ahora
  setTimeout(() => observer.next(2), 1000);      // emite 2 en 1 segundo
  setTimeout(() => observer.next(3), 2000);      // emite 3 en 2 segundos
});
```

El sufijo `$` es una convención para identificar Observables.

### `BehaviorSubject` — Observable con memoria

```typescript
// course.ts
private readonly allCourses$ = new BehaviorSubject<Course[]>(MOCK_COURSES);
private readonly filters$ = new BehaviorSubject<CourseFilters>({
  search: '',
  level: 'all',
  category: 'all',
});
```

Un `BehaviorSubject`:
- **Recuerda su último valor** — los nuevos suscriptores reciben el valor actual inmediatamente
- **Es escribible** con `.next(nuevoValor)`
- **Es la versión RxJS de `signal()`** para gestión de estado

### `combineLatest` — combinando flujos

```typescript
// Emite cada vez que CUALQUIERA de sus fuentes emite
readonly courses$: Observable<Course[]> = combineLatest([
  this.allCourses$,
  this.filters$.pipe(debounceTime(250), distinctUntilChanged()),
]).pipe(
  map(([courses, filters]) => this.applyFilters(courses, filters))
);
```

Funciona como un `computed()` pero para Observables:

```text
allCourses$ emite  →  [cursos, filtros actuales]  →  applyFilters()  →  emite resultado
filters$ emite     →  [cursos actuales, filtros]  →  applyFilters()  →  emite resultado
```

### Operadores de optimización

```typescript
this.filters$.pipe(
  debounceTime(250),        // Espera 250ms de silencio antes de emitir
                            // Si el usuario escribe "Angular" en 200ms, solo filtra una vez
  distinctUntilChanged(),   // No emite si el valor es idéntico al anterior
                            // Evita recálculos innecesarios
)
```

### Operadores esenciales

| Operador | Qué hace | Ejemplo de uso |
|---|---|---|
| `map` | Transforma cada valor emitido | Extraer un campo de un objeto |
| `filter` | Filtra valores que no cumplen la condición | Descartar valores nulos |
| `debounceTime(ms)` | Espera silencio antes de emitir | Búsqueda en tiempo real |
| `distinctUntilChanged` | No emite si el valor no cambió | Evitar re-filtrado innecesario |
| `combineLatest` | Combina múltiples fuentes | Estado derivado de dos streams |
| `switchMap` | Cancela la petición anterior | Búsqueda que cancela al escribir |

### El flujo completo de datos en el catálogo

```text
Usuario escribe "Angular"
       ↓
  updateSearch("Angular")
       ↓
  filters$.next({ search: "Angular", ... })
       ↓
  combineLatest detecta el cambio
       ↓
  debounceTime(250) — espera 250ms de silencio
       ↓
  applyFilters() filtra los cursos
       ↓
  courses$ emite el array filtrado
       ↓
  toSignal() actualiza el Signal
       ↓
  Angular re-renderiza solo el @for
```

---

## 8. Componentes anidados e Inputs

### La jerarquía del catálogo

```text
CatalogPage                    ← gestiona la lista y el buscador
  └── CourseCard               ← presenta un curso completo
        └── LessonList         ← gestiona expandir/colapsar
              └── LessonItem   ← renderiza una sola lección
```

### `input.required<T>()` — inputs basados en Signals

El nuevo API de inputs de Angular (v17+):

```typescript
// lesson-item.ts
import { Component, input } from '@angular/core';
import { Lesson } from '../../../core/models/lesson.model';

export class LessonItem {
  // Input obligatorio — TypeScript fuerza que el padre lo pase en build time
  readonly lesson = input.required<Lesson>();
}
```

```html
<!-- lesson-item.html — se lee llamándolo como función (es un Signal) -->
<span>{{ lesson().title }}</span>
<span>{{ lesson().durationMinutes }} min</span>
```

Comparación con el API clásico:

```typescript
// ❌ API clásico
@Input({ required: true }) lesson!: Lesson;
// En template: lesson.title

// ✅ API moderno con Signals
readonly lesson = input.required<Lesson>();
// En template: lesson().title  (es un Signal, hay que llamarlo)
```

**Ventajas del nuevo API**:
- Es un `InputSignal<T>` — puedes usarlo en `computed()`
- El compilador fuerza que el padre pase el valor (no en runtime, sino en build time)
- Tipo estricto — sin `!` ni valores `undefined` sorpresa

### Flujo de datos unidireccional

```text
CatalogPage
  courses Signal<Course[]>
       ↓  [course]="course"
  CourseCard
    course InputSignal<Course>
         ↓  [lessons]="course().lessons"
    LessonList
      lessons InputSignal<Lesson[]>
           ↓  [lesson]="lesson"
      LessonItem
        lesson InputSignal<Lesson>
```

Los datos siempre fluyen **hacia abajo**. Los hijos nunca modifican los datos del padre. Esto hace la app **predecible**: si algo se muestra mal en `LessonItem`, el problema está en cómo `LessonList` le pasa los datos.

### Estado local en componentes hijos

```typescript
// lesson-list.ts — estado que nadie más necesita
export class LessonList {
  readonly lessons = input.required<Lesson[]>();

  // expanded es local — no necesita vivir en un servicio
  protected readonly expanded = signal(false);

  protected toggle(): void {
    this.expanded.update(v => !v);
  }
}
```

> [!TIP]
> **Regla:** el estado debe vivir en el **nivel más bajo posible** que lo necesite.
> - Solo este componente necesita saber si está expandido → Signal local
> - Varios componentes necesitan saber quién está logado → Signal en `AuthService`

### `@switch` en templates

```html
@switch (lesson().type) {
  @case ('video')   { 🎬 }
  @case ('article') { 📄 }
  @case ('quiz')    { ✅ }
}
```

Más limpio que `@if/@else if` cuando hay múltiples valores posibles. Si el Union Type crece con un nuevo tipo y olvidamos el `@case`, el compilador puede avisarnos.

### Importar componentes hijos

```typescript
// course-card.ts
import { LessonList } from '../lesson-list/lesson-list';

@Component({
  selector: 'app-course-card',
  imports: [LessonList],           // ← necesario para usar <app-lesson-list> en el template
  templateUrl: './course-card.html',
})
export class CourseCard {
  readonly course = input.required<Course>();
}
```

---

## 9. Signal Forms

### ¿Por qué Signal Forms?

Angular 22 introduce Signal Forms como la forma **recomendada** de gestionar formularios. Integran los Signals directamente en el modelo del formulario, eliminando la necesidad de suscribirse a `valueChanges` o usar `FormBuilder`.

### Crear un formulario

```typescript
// profile-page.ts
import { form, FormField, required, email, minLength, maxLength } from '@angular/forms/signals';

export class ProfilePage {
  private readonly auth = inject(AuthService);

  // 1. El modelo — Signal con los valores iniciales (NUNCA null o undefined)
  protected readonly profileModel = signal({
    name:    this.auth.currentUser()?.name  ?? '',  // ?? '' garantiza string, nunca null
    email:   this.auth.currentUser()?.email ?? '',
    bio:     '',
    website: '',
  });

  // 2. El formulario — se crea a partir del modelo
  protected readonly profileForm = form(this.profileModel, (f) => {
    // Las validaciones se declaran aquí, separadas del HTML
    required(f.name,    { message: 'El nombre es obligatorio' });
    minLength(f.name, 3, { message: 'Mínimo 3 caracteres' });
    maxLength(f.name, 50);
    required(f.email,   { message: 'El email es obligatorio' });
    email(f.email,      { message: 'Introduce un email válido' });
    maxLength(f.bio, 200);
  });
}
```

### La regla fundamental: `FormField` vs `FieldState`

Esta es la parte más importante de Signal Forms y la fuente más común de errores:

```typescript
profileForm.name      // FormField  — la estructura, NO tiene signals de estado
profileForm.name()    // FieldState — tiene .value(), .errors(), .touched()...
profileForm()         // FieldState raíz — tiene .valid(), .value() del form completo
```

Llamar al campo **como función** es lo que "abre" el Signal y da acceso al estado:

```typescript
// ❌ Error de compilación — FormField no tiene estas propiedades
profileForm.valid()
profileForm.name.errors()

// ✅ Correcto — FieldState sí las tiene
profileForm().valid()
profileForm.name().errors()
```

### Binding en el template

```html
<!-- profile-page.html -->
<form (ngSubmit)="onSubmit()">

  <div class="form-group">
    <label>Nombre</label>
    <!-- [formField] conecta el input con el campo del formulario -->
    <input type="text" [formField]="profileForm.name" />

    <!-- Mostrar errores solo tras el primer intento de envío -->
    @if (submitted() && profileForm.name().errors().length) {
      <span class="error">{{ profileForm.name().errors()[0].message }}</span>
    }
  </div>

  <!-- Contador de caracteres en tiempo real -->
  <div class="form-group">
    <label>
      Biografía
      <span>{{ profileForm.bio().value().length }} / 200</span>
    </label>
    <textarea [formField]="profileForm.bio"></textarea>
  </div>

  <button type="submit">Guardar</button>

  @if (submitted() && !profileForm().valid()) {
    <span>Revisa los campos obligatorios</span>
  }

</form>
```

> [!WARNING]
> **Atributos prohibidos con `[formField]`:** no uses `[disabled]`, `[readonly]`, `value`, `[value]`, `min`, `max` — el directive ya los gestiona internamente.

### Gestión del envío

```typescript
protected readonly submitted = signal(false);

protected onSubmit(): void {
  this.submitted.set(true);                  // Marca que el usuario intentó enviar

  if (!this.profileForm().valid()) return;   // Bloquea si hay errores

  console.log('Datos:', this.profileForm().value());  // Accede a todos los valores
  // Aquí iría la llamada al servicio/API
}
```

**Patrón `submitted`**: los errores solo se muestran **después del primer intento de envío**, no mientras el usuario escribe por primera vez. Mejor experiencia de usuario.

---

## 10. Referencia rápida

### Signals

```typescript
const x = signal(0);            // Crear con valor inicial
x();                             // Leer el valor
x.set(5);                        // Escribir (reemplaza el valor)
x.update(v => v + 1);            // Escribir (basado en el valor anterior)
x.asReadonly();                  // Exponer como solo lectura

const doble = computed(() => x() * 2);  // Valor derivado (lazy + memoizado)
```

### Servicios

```typescript
@Service()                       // Singleton global, tree-shakeable
export class MiServicio {
  private readonly dep = inject(OtraDependencia);
}
```

### Componentes

```typescript
@Component({
  selector: 'app-mi-comp',
  imports: [ComponenteHijo],     // Componentes/pipes usados en el template
  templateUrl: './mi-comp.html',
  styleUrl: './mi-comp.scss',
})
export class MiComponente {
  readonly dato = input.required<string>();  // Input obligatorio
  readonly titulo = input('Sin título');     // Input opcional con valor por defecto
  private readonly srv = inject(MiServicio); // Servicio inyectado
}
```

### Guards

```typescript
export const miGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.parseUrl('/login');
};
```

### RxJS esencial

```typescript
// Estado mutable
const estado$ = new BehaviorSubject<T>(valorInicial);
estado$.next(nuevoValor);           // Emitir nuevo valor
estado$.getValue();                  // Leer valor actual sin suscribirse

// Combinar fuentes
combineLatest([a$, b$]).pipe(
  map(([a, b]) => /* derivar valor */)
)

// Optimización de búsqueda
input$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(query => buscar(query))
)

// Convertir Observable a Signal
const datos = toSignal(datos$, { initialValue: [] });
```

### Template control flow

```html
@if (condicion()) {
  <!-- si condicion() es truthy -->
} @else {
  <!-- alternativa -->
}

@for (item of lista(); track item.id) {
  <!-- itera — track es obligatorio para rendimiento -->
} @empty {
  <!-- si la lista está vacía -->
}

@switch (valor()) {
  @case ('a') { <!-- si valor() === 'a' --> }
  @case ('b') { <!-- si valor() === 'b' --> }
}
```

---

## ¿Listo para el siguiente nivel?

Si ya dominas los conceptos de esta guía, continúa con la
[Guía Avanzada → ADVANCED.md](./ADVANCED.md)

*Requisito previo: haber completado los 9 módulos anteriores.*

---

## Comandos del proyecto

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:4200)
ng serve

# Compilar para producción
ng build

# Generar un componente
ng generate component features/mi-feature/mi-componente

# Generar un servicio
ng generate service core/services/mi-servicio

# Verificar errores sin compilar
ng build --configuration development
```

## Usuarios de prueba

| Email | Rol | Acceso |
|---|---|---|
| `ana@devpath.io` | student | Catálogo, Mi aprendizaje, Perfil |
| `admin@devpath.io` | admin | Todo lo anterior + acceso admin |

---

*Proyecto educativo construido con Angular 22. Cada concepto está implementado en código real y funcional.*

---

## ¿Listo para el siguiente nivel?

Si ya dominas los conceptos de esta guía, continúa con la guía avanzada:

**[Guía Avanzada de Angular → ADVANCED.md](./ADVANCED.md)**

Cubre HTTP real, interceptores, signals avanzados, routing avanzado, `@defer`, directivas, DI avanzada y más — todo sobre la misma aplicación DevPath.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
