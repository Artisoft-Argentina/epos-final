-- Script de inicialización de MySQL para EPOS
-- Se ejecuta una sola vez cuando el contenedor MySQL arranca por primera vez.
--
-- CRÍTICO para multitenant: el usuario de la app necesita CREATE DATABASE
-- porque stancl/tenancy crea una base de datos separada por empresa.

-- Otorgar permisos completos al usuario de la app (necesario para crear DBs de tenants)
GRANT ALL PRIVILEGES ON *.* TO 'epos_user'@'%' WITH GRANT OPTION;

FLUSH PRIVILEGES;
