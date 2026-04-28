-- Script de inicialización de PostgreSQL para EPOS
-- Se ejecuta una sola vez cuando el contenedor PostgreSQL arranca por primera vez.
--
-- CRÍTICO para multitenant: el usuario de la app necesita CREATEDB
-- porque stancl/tenancy crea una base de datos separada por empresa.

ALTER USER epos_user CREATEDB;
