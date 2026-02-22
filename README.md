# Vivis

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.5.

## Supabase

El proyecto usa Supabase para autenticación. Todas las rutas (excepto `/login`) requieren estar logeado.

**Configuración:**
1. Copia tus credenciales de Supabase (Project URL y anon key) desde el dashboard de tu proyecto.
2. Edita `src/environments/environment.ts` y `src/environments/environment.development.ts`:
   - Reemplaza `TU_PROYECTO.supabase.co` con tu Project URL
   - Reemplaza `TU_ANON_KEY` con tu anon/public key

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
