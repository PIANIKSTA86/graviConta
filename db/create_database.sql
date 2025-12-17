-- Script para crear la base de datos GraviConta en MySQL
-- Ejecutar este script desde phpMyAdmin (http://localhost/phpmyadmin)

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS graviconta 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Seleccionar la base de datos
USE graviconta;

-- La base de datos está lista para que Prisma cree las tablas
-- Ejecutar: npm run db:push
