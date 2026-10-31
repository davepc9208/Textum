# Backups locales diarios de TEXTUM (Windows)

Este procedimiento crea un archivo diario en el ordenador con tres dumps lógicos de Postgres y los objetos del bucket `blog-images`. No usa GitHub ni sube la copia a otro servicio. Conserva los ZIP durante 30 días por defecto.

## Requisitos

- Windows PowerShell 5.1 o superior, Node.js 20 o superior y Docker Desktop instalado y en ejecución. Supabase CLI `2.122.0` queda fijado como dependencia de desarrollo del proyecto.
- URL de conexión de Postgres de Supabase (Dashboard → **Connect**), con la contraseña URL-encoded si contiene caracteres especiales.
- Un Supabase Personal Access Token para que la CLI lea Storage en el proyecto. Se pide de forma oculta durante la configuración y se cifra con DPAPI para el usuario actual de Windows.
- Espacio local suficiente para una copia adicional de los dumps y los archivos de `blog-images`.

La carpeta del bucket se recorre con `supabase storage cp --recursive`. El proceso no necesita saber si `blog-images` es público o privado; el token se usa desde el ordenador y nunca se pone en el bundle ni en Git.

## Instalación única

Abre PowerShell en la raíz del proyecto y ejecuta:

```powershell
npm ci
.\scripts\backups\setup.ps1
```

Indica:

1. La URL de Supabase (solo el origen `https://<project-ref>.supabase.co`).
2. La cadena `postgresql://...` de **Connect** (entrada oculta).
3. Tu Supabase Personal Access Token (entrada oculta).

De forma predeterminada, registra una tarea diaria a las 02:30 y guarda los ZIP en `C:\Users\<usuario>\TEXTUM-Backups`, con 30 días de retención. Se puede personalizar la hora, carpeta local y retención:

```powershell
.\scripts\backups\setup.ps1 -DailyAt '03:15' -BackupDirectory 'D:\TEXTUM-Backups' -RetentionDays 45
```

La configuración y credenciales DPAPI se guardan en `%LOCALAPPDATA%\TEXTUM\Backup\config.json`, fuera del repositorio y con ACL limitada al usuario actual y SYSTEM. Solo el mismo usuario de Windows, en este mismo equipo, podrá descifrarlas; no copies ese `config.json` a otro ordenador.

La tarea queda configurada para ejecutarse en la sesión interactiva de este usuario Windows. El equipo debe estar encendido y el usuario debe haber iniciado sesión; si el equipo está dormido, `StartWhenAvailable` intenta ejecutarla cuando vuelva a estar disponible. Docker Desktop también debe estar iniciado. Consulta su resultado en **Task Scheduler → Task Scheduler Library → TEXTUM Supabase Daily Backup → Last Run Result**.

## Ejecutar y verificar ahora

Después de configurar, genera y verifica la primera copia manualmente:

```powershell
.\scripts\backups\test.ps1
```

También puedes ejecutar `run.ps1` y `verify.ps1` por separado para pasos de diagnóstico.

La salida esperada indica la ruta al ZIP y cuántos objetos se copiaron. `verify.ps1` comprueba que el ZIP se puede abrir y contiene los dumps requeridos y el manifiesto. Si faltan credenciales, Docker o acceso a Storage, la copia falla; no se crea ni conserva un ZIP parcial.

El SQL se exporta usando los comandos documentados por Supabase (`roles.sql`, `schema.sql`, `data.sql`). Storage se copia en `Storage\blog-images\`. El manifiesto guarda proyecto, fecha y recuentos, no contraseñas.

## Restauración de emergencia (en un proyecto nuevo/de prueba)

No restaures sobre producción para probar. Una restauración lógica completa de Supabase requiere un proyecto destino preparado y una ventana de mantenimiento:

1. Copia el ZIP a un lugar de trabajo privado y extráelo.
2. Crea/prepara el proyecto Supabase destino y configura las extensiones y webhooks necesarios. Verifica manualmente las diferencias de Auth y Storage, y la configuración de bucket/políticas; los dumps de plataforma no incluyen todos los ajustes del servicio.
3. Con PostgreSQL `psql` instalado, restaura `roles.sql`, `schema.sql` y `data.sql` siguiendo la [guía de Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore). Usa la cadena del proyecto destino; confirma que el proyecto destino es el correcto antes de ejecutar.
4. Crea/configura el bucket `blog-images` con su visibilidad, límites y políticas anteriores, y vuelve a subir recursivamente su carpeta local con Supabase CLI. Los objetos de Storage **no** están dentro del dump SQL.
5. Comprueba publicaciones, cuentas necesarias, políticas RLS, archivos e inicio de sesión en el proyecto de prueba.

La referencia de restore de Supabase incluye casos especiales para cambios propios en esquemas `auth` y `storage`, roles de login personalizados y extensiones. Una restauración no reconstruye por sí sola todos los ajustes de Auth, secretos de proveedores, funciones Edge ni configuración del proyecto.

## Seguridad y limitaciones importantes

- Los ZIP están protegidos por ACL de Windows, **pero no están cifrados por este script**. Activa BitLocker o guarda copias en un volumen cifrado. No uses una carpeta compartida ni sincronizada si no has configurado cifrado y controles de acceso.
- Una copia en el mismo ordenador protege de errores de datos, pero no de fallo, robo o pérdida del equipo. Para protección real ante esas situaciones, copia periódicamente los ZIP a un disco externo cifrado y desconectado.
- Las copias locales contienen datos de la base de datos y archivos del blog; limita quién accede al usuario Windows.
- Si cambias de equipo o de usuario Windows, vuelve a ejecutar `setup.ps1`; las credenciales DPAPI no son portables.
- Estas copias incluyen el dump lógico de base de datos y los objetos del bucket `blog-images`. No incluyen secretos/configuración de Auth, Edge Functions, claves, políticas de Cloudflare ni otros buckets. Si el proyecto añade buckets, actualiza el alcance del script.
- Almacena también los archivos `.sql` de migraciones del repositorio: son necesarios para interpretar y recrear cambios de esquema, pero no contienen la copia de registros.

Referencias: [Supabase backup/restore con CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [backups de base de datos](https://supabase.com/docs/guides/platform/backups), [descarga de objetos Storage](https://supabase.com/docs/guides/storage/management/download-objects).
