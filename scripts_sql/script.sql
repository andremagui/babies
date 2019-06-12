CREATE DATABASE IF NOT EXISTS cresceuPerdeu;
USE cresceuPerdeu;

-- ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root'

-- DROP TABLE IF EXISTS usuario;
CREATE TABLE usuario (
	idUsuario int NOT NULL AUTO_INCREMENT,
	login varchar(50) NOT NULL,
	nome varchar(100) NOT NULL,
	email varchar(100) NOT NULL,
	endereco varchar(100) NOT NULL,
	cep varchar(40) NOT NULL,
	senha varchar(100) NOT NULL,
	token char(32) DEFAULT NULL,
	PRIMARY KEY (idUsuario),
	UNIQUE KEY login_UNIQUE (login)
);

INSERT INTO usuario (login, nome, email, endereco, CEP, senha) VALUES
('ANDRE.AGUIAR','ANDRE','andre@andre.com', 'Rua Joaquim Tavora 1240', '04015-013', 'peTcC99vkvvLqGQL7mdhGuJZIvL2iMEqvCNvZw3475PJ:JVyo1Pg2HyDyw9aSOd3gNPT30KdEyiUYCjs7RUzSoYGN');

CREATE TABLE genero (
	id int NOT NULL AUTO_INCREMENT,
	descricao varchar(10),
	PRIMARY KEY (id)
);

INSERT INTO genero (descricao) VALUES 
('Masculino'),
('Feminino');

CREATE TABLE estado (
	id int NOT NULL AUTO_INCREMENT,
	descricao varchar(30),
	PRIMARY KEY (id)
);

INSERT INTO estado (descricao) VALUES 
('Novo'),
('Seminovo'),
('Usado'),
('Mau Estado');

CREATE TABLE faixaetaria (
	id int NOT NULL AUTO_INCREMENT,
	descricao varchar(50),
	PRIMARY KEY (id)
);

INSERT INTO faixaetaria (descricao) VALUES 
('1 - 3 meses'),
('4 - 6 meses'),
('7 - 9 meses'),
('10 - 12 meses'),
('1 - 2 anos'),
('3 - 4 anos'),
('5 - 6 anos'),
('7 - 8 anos'),
('9 - 10 anos'),
('11 - 12 anos');

CREATE TABLE tipo (
	id int NOT NULL AUTO_INCREMENT,
	descricao varchar(10) NOT NULL,
	PRIMARY KEY (id)
);

INSERT INTO tipo (descricao) VALUES 
('Acessórios'),
('Brinquedos'),
('Roupas');

CREATE TABLE acao (
	id int NOT NULL AUTO_INCREMENT,
	descricao varchar(10) NOT NULL,
	PRIMARY KEY (id)
);

INSERT INTO acao (descricao) VALUES 
('Venda'),
('Troca');

CREATE TABLE cadastro (
	idCadastro int NOT NULL AUTO_INCREMENT,
	idUsuario int NOT NULL,
	descricao varchar(100) NOT NULL,
	tipo int NOT NULL,
	estado int NOT NULL,
	valor decimal NOT NULL,
	faixaetaria int NOT NULL,
	acao int NOT NULL,
	peso float NOT NULL,
	genero int NOT NULL,
	PRIMARY KEY (idCadastro),
	CONSTRAINT idUsuario_FK FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario) ON DELETE CASCADE,
	CONSTRAINT tipo_FK FOREIGN KEY (tipo) REFERENCES tipo (id) ON DELETE CASCADE,
	CONSTRAINT estado_FK FOREIGN KEY (estado) REFERENCES estado (id) ON DELETE CASCADE,
	CONSTRAINT faixaetaria_FK FOREIGN KEY (faixaetaria) REFERENCES faixaetaria (id) ON DELETE CASCADE,
	CONSTRAINT acao_FK FOREIGN KEY (acao) REFERENCES acao (id) ON DELETE CASCADE,
	CONSTRAINT genero_FK FOREIGN KEY (genero) REFERENCES genero (id) ON DELETE CASCADE
);

INSERT INTO cadastro (idUsuario, descricao, tipo, estado, valor, faixaetaria, acao, peso, genero) VALUES
(1, 'Shorts Preto Kawabanga', 3, 2, 5, 5, 1, 0.100, 1);
