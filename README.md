📝 Note Collaboration App
Una aplicación moderna de workspace y gestión de notas similar a Notion, construida con Next.js, TypeScript y Supabase con migraciones locales.

🎯 Objetivo de la Aplicación
Esta aplicación permite a equipos y usuarios individuales crear espacios de trabajo colaborativos donde pueden:

Crear y organizar notas en diferentes workspaces

Compartir notas con miembros del equipo con diferentes niveles de permisos

Colaborar en tiempo real dentro de workspaces compartidos

Gestionar permisos y roles de usuarios (Owner, Admin, Member)

🚀 Características Principales
✅ Autenticación segura con Supabase Auth

✅ Workspaces multi-usuario

✅ Notas colaborativas

✅ Sistema de permisos y roles avanzado

✅ Compartición de notas con niveles de acceso

✅ Interfaz moderna y responsive

✅ Base de datos local con migraciones

✅ Row Level Security (RLS) para seguridad

📋 Requisitos Técnicos
Prerrequisitos
Node.js 18.17 o superior

npm o yarn o pnpm

Git instalado

Supabase CLI (instalación incluida en la guía)

Docker Desktop (para base de datos local)

Dependencias Principales
Next.js 

TypeScript

Tailwind CSS

Supabase (Local + CLI)

React Hook Form

Sonner (Toasts)

🛠️ Instalación Paso a Paso COMPLETA
Paso 1: Preparar el Entorno
1.1 Instalar Docker Desktop
Ve a docker.com/products/docker-desktop

Descarga Docker Desktop para tu sistema operativo

Instálalo siguiendo el asistente

Inicia Docker Desktop y déjalo corriendo en segundo plano

1.2 Instalar Supabase CLI
bash
# En Windows (PowerShell como Administrador)
winget install Supabase.cli

# En macOS
brew install supabase/tap/supabase

# En Linux
curl -fsSL https://supabase.com/docs/guides/cli | sh

# Verificar instalación
supabase --version
Paso 2: Clonar y Configurar el Proyecto
bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio

# Instalar dependencias de Node.js
npm install
Paso 3: Configurar Supabase Local
3.1 Inicializar Supabase Local
bash
# Inicializar Supabase en el proyecto
supabase init

# Iniciar los servicios de Supabase local (Docker debe estar corriendo)
supabase start
✅ Deberías ver una salida similar:

text
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJh... (tu clave anónima)
service_role key: eyJh... (tu clave de servicio)
3.2 Configurar Variables de Entorno
Crea un archivo .env.local en la raíz del proyecto

Copia los valores de la salida anterior y pégalos:

env
# Usa los valores que te mostró 'supabase start'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_la_salida
Paso 4: Ejecutar Migraciones de Base de Datos
4.1 Aplicar Migraciones Existentes
bash
# Aplicar todas las migraciones a la base de datos local
supabase db reset
4.2 Verificar Migraciones
bash
# Ver migraciones aplicadas
supabase migration list
Paso 5: Configurar Authentication
5.1 Abrir Studio de Supabase
bash
# Abre el panel de administración en tu navegador
supabase studio
5.2 Configurar Authentication en Studio
Ve a Authentication > Settings

En "Site URL" agrega: http://localhost:3000

En "Redirect URLs" agrega: http://localhost:3000/**

Guarda los cambios

Paso 6: Ejecutar la Aplicación
bash
# Iniciar la aplicación en modo desarrollo
npm run dev
Paso 7: Abrir la Aplicación
Ve a: http://localhost:3000

🎉 ¡La aplicación debería estar funcionando completamente!

🗄️ Estructura de Base de Datos
Tablas Principales
profiles
Almacena información de usuarios

Relacionada con auth.users de Supabase

workspaces
Espacios de trabajo colaborativos

Cada workspace tiene un owner_id

workspace_members
Relación usuarios-workspaces

Roles: owner, admin, member

notes
Notas dentro de workspaces

Sistema de compartición integrado

note_shares
Control de compartición de notas

Políticas de Seguridad (RLS)
La aplicación usa Row Level Security para:

✅ Usuarios solo ven sus propios datos

✅ Miembros ven solo workspaces a los que pertenecen

✅ Owners tienen control total sobre sus workspaces

✅ Admins tienen permisos limitados

📖 Guía de Uso Completa
👤 Registro y Autenticación
Primer Uso - Registro:
Haz clic en "Get Started" en la página principal

Completa el formulario:

Email: tu-email@ejemplo.com

Contraseña: mínima 6 caracteres

Verifica tu email (revisa Inbucket en http://localhost:54324)

Inicia sesión con tus credenciales

Inbox de Email Local (Para Verificación):
bash
# Ver emails de verificación
# Abre: http://localhost:54324
# O usa:
supabase status
# Y ve a "Inbucket URL"
🏠 Dashboard - Vista Principal
Al iniciar sesión verás:

Estadísticas: Número de workspaces y miembros

Lista de Workspaces: Tus espacios de trabajo activos

Botón "Create Workspace": Para crear nuevos espacios

🏢 Gestión de Workspaces
Crear un Workspace:
Haz clic en "Create Workspace"

Completa el formulario:

Name: "Mi Primer Workspace"

Description: "Espacio para mis notas personales"

Haz clic en "Create"

Automáticamente serás agregado como Owner

👥 Gestión de Miembros
Probar con Múltiples Usuarios:
Abre una ventana de incógnito

Registra un segundo usuario (user2@test.com)

En tu usuario principal, invita al segundo usuario:

Ve a "Members" en el workspace

Haz clic en "Invite Member"

Ingresa: user2@test.com

Rol: Member

Roles y Permisos:
Owner: Creador, control total

Admin: Puede invitar miembros (solo como Member)

Member: Puede crear y editar notas

📝 Gestión de Notas
Crear y Compartir Notas:
Crea una nota en tu workspace

Haz clic en "Share" junto a la nota

Selecciona el usuario que invitaste

Cambia al usuario invitado para verificar el acceso

🔧 Comandos de Desarrollo
Gestión de Base de Datos
bash
# Reiniciar base de datos (útil para pruebas)
supabase db reset

# Ver estado de Supabase
supabase status

# Detener servicios Supabase
supabase stop

# Ver logs de la base de datos
supabase logs
Migraciones Personalizadas
bash
# Crear nueva migración
supabase migration create nombre_migracion

# Aplicar migraciones pendientes
supabase db push
Desarrollo
bash
# Desarrollar con hot reload
npm run dev

# Construir para producción
npm run build

# Ver tipos TypeScript
npm run type-check
🐛 Solución de Problemas Comunes
Error: "Supabase local not starting"
Verifica que Docker esté corriendo

Reinicia Docker Desktop

Ejecuta: supabase stop y luego supabase start

Error: "Database connection failed"
Verifica que los servicios Supabase estén activos: supabase status

Reinicia: supabase db reset

Error: "Authentication failed"
Verifica las URLs en Supabase Studio: http://localhost:54323

Asegúrate que Site URL sea: http://localhost:3000

Error: "Migration failed"
Restablece la base de datos: supabase db reset

Verifica la sintaxis SQL en archivos de migración

La aplicación no carga
Verifica las variables de entorno en .env.local

Confirma que npm run dev esté corriendo

Revisa la consola del navegador para errores específicos

📁 Estructura del Proyecto
text
tu-proyecto/
├── supabase/
│   ├── migrations/          # Migraciones de base de datos
│   │   ├── 001_initial.sql
│   │   └── 002_rls_policies.sql
│   └── config.toml         # Configuración de Supabase
├── app/                    # Next.js App Router
│   ├── dashboard/
│   ├── auth/
│   └── layout.tsx
├── components/             # Componentes React
│   ├── ui/                 # Componentes de UI
│   └── workspaces/         # Lógica de workspaces
├── lib/
│   └── supabase/           # Cliente y utilidades
└── .env.local              # Variables de entorno

🔄 Flujo de Desarrollo
Para Agregar Nuevas Funcionalidades:
Crear migración: supabase migration create nueva_funcionalidad

Editar archivo SQL en supabase/migrations/

Aplicar migración: supabase db reset

Desarrollar componentes en app/ y components/

Probar localmente

Para Hacer Cambios en la Base de Datos:
Detener app: Ctrl+C

Crear migración con los cambios

Aplicar migración

Reiniciar app: npm run dev

🚀 Despliegue (Opcional)
Para llevar a producción:
Crear proyecto en Supabase Cloud

Ejecutar migraciones en producción:

bash
supabase link --project-ref tu-project-ref
supabase db push
Actualizar variables de entorno con URLs de producción

Desplegar en Vercel/Netlify

📞 Soporte y Troubleshooting
Recursos Útiles:
Supabase Studio Local: http://localhost:54323

Email Testing (Inbucket): http://localhost:54324

API Local: http://localhost:54321

Si tienes problemas:
Verifica todos los servicios: supabase status

Reinicia todo: supabase stop && supabase start

Resetea base de datos: supabase db reset

Revisa logs: supabase logs

Comandos de Diagnóstico:
bash
# Verificar estado completo
supabase status

# Ver logs en tiempo real
supabase logs --follow

# Verificar salud de Docker
docker ps

# Verificar Node.js
node --version
npm --version

Ahora tienes un entorno de desarrollo completo con:

✅ Base de datos PostgreSQL local

✅ Authentication con Supabase Auth

✅ Migraciones automatizadas

✅ Entorno aislado para testing

✅ Panel de administración (Studio)