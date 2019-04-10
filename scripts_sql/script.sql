CREATE DATABASE IF NOT EXISTS cresceuPerdeu;
USE cresceuPerdeu;

-- ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root'

-- DROP TABLE IF EXISTS perfil;
CREATE TABLE perfil (
	id int NOT NULL AUTO_INCREMENT,
	nome varchar(100) NOT NULL,
	PRIMARY KEY (id),
	UNIQUE KEY nome_UNIQUE (nome)
);

INSERT INTO perfil (nome) VALUES ('ADMINISTRADOR');

-- DROP TABLE IF EXISTS usuario;
CREATE TABLE usuario (
	id int NOT NULL AUTO_INCREMENT,
	login varchar(50) NOT NULL,
	nome varchar(100) NOT NULL,
	email varchar(100) NOT NULL,
	endereco varchar(100) NOT NULL,
	cep varchar(40) NOT NULL,
	perfil int NOT NULL,
	senha varchar(100) NOT NULL,
	token char(32) DEFAULT NULL,
	PRIMARY KEY (id),
	UNIQUE KEY login_UNIQUE (login),
	CONSTRAINT perfil_FK FOREIGN KEY (perfil) REFERENCES perfil (id) ON DELETE CASCADE
);

INSERT INTO usuario (login, nome, email, endereco, CEP, perfil, senha) VALUES
('ADMIN','ADMINISTRADOR','admin@admin.com', 'Rua Joaquim Tavora 1240', '04015-013', 1, 'peTcC99vkvvLqGQL7mdhGuJZIvL2iMEqvCNvZw3475PJ:JVyo1Pg2HyDyw9aSOd3gNPT30KdEyiUYCjs7RUzSoYGN');
