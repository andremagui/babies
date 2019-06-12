import { randomBytes } from "crypto";
import express = require("express");
// https://www.npmjs.com/package/lru-cache
import lru = require("lru-cache");
import Sql = require("../infra/sql");
import GeradorHash = require("../utils/geradorHash");

export = class Usuario {
	private static readonly cacheUsuarioLogados = lru(100);

	// A senha padrão é 1234
	private static readonly HashSenhaPadrao = "peTcC99vkvvLqGQL7mdhGuJZIvL2iMEqvCNvZw3475PJ:JVyo1Pg2HyDyw9aSOd3gNPT30KdEyiUYCjs7RUzSoYGN";
	// Não utilizar números > 0x7FFFFFFF, pois os XOR resultarão em -1
	private static readonly HashId = 0x16e7fef4;

	public static readonly TipoAdmin = 0;
	public static readonly TipoComum = 1;

	public idUsuario: number;
	public login: string;
	public nome: string;
    public email: string;
    public endereco: string;
    public cep: string;
    public senha: string;

	// Utilizados apenas no cache
	private cookieStr: string;
	public admin: boolean;

	public static removerDoCache(idUsuario: number): void {
        Usuario.cacheUsuarioLogados.del(idUsuario);
	}

	// Parei de usar Usuario.pegarDoCookie como middleware, porque existem muitas requests
	// que não precisam validar o usuário logado, e agora, é assíncrono...
	// http://expressjs.com/pt-br/guide/writing-middleware.html
	//public static pegarDoCookie(req: express.Request, res: express.Response, next: Function): void {
	public static async cookie(req: express.Request, res: express.Response = null, admin: boolean = false): Promise<Usuario> {
		let cookieStr = req.cookies["usuario"] as string;
		if (!cookieStr || cookieStr.length !== 48) {
			if (res) {
				res.statusCode = 403;
				res.json("Não permitido");
			}
			return null;
		} else {
            let idUsuario = parseInt(cookieStr.substr(0, 8), 16) ^ Usuario.HashId;
            let usuario = Usuario.cacheUsuarioLogados.get(idUsuario) as Usuario;
			if (usuario) {
				if (usuario.cookieStr !== cookieStr)
					usuario = null;
			} else {
				usuario = null;

				await Sql.conectar(async (sql: Sql) => {
                    let rows = await sql.query("select idUsuario, login, nome, senha, email, endereco, cep, token from usuario where idUsuario = ?", [idUsuario]);
					let row;

					if (!rows || !rows.length || !(row = rows[0]))
						return;

					let token = cookieStr.substring(16);

					if (!row.token ||
						token !== (row.token as string))
						return;

					let u = new Usuario();
                    u.idUsuario = idUsuario;
					u.login = row.login as string;
                    u.nome = row.nome as string;
                    u.senha = row.senha as string;
                    u.email = row.email as string;
                    u.endereco = row.endreco as string;
                    u.cep = row.cep as string;
					u.cookieStr = cookieStr;

                    Usuario.cacheUsuarioLogados.set(idUsuario, u);

					usuario = u;
				});
			}
			if (!usuario && res) {
				res.statusCode = 403;
				res.json("Não permitido");
			}
			return usuario;
		}
	}

    private static gerarTokenCookie(idUsuario: number): [string, string] {
        let idStr = "0000000" + (idUsuario ^ Usuario.HashId).toString(16);
		let idEventoLogadoStr = "00000000";
		let token = randomBytes(16).toString("hex");
		let cookieStr = idStr.substring(idStr.length - 8) + idEventoLogadoStr.substring(idEventoLogadoStr.length - 8) + token;
		return [token, cookieStr];
	}
	
	public static async efetuarLogin(login: string, senha: string, res: express.Response): Promise<[string, Usuario]> {
		if (!login || !senha)
			return ["Usuário ou senha inválidos", null];

		let r: string = null;
		let u: Usuario = null;

		await Sql.conectar(async (sql: Sql) => {
			login = login.trim().toUpperCase();

            let rows = await sql.query("select idUsuario, login, nome, senha, email, endereco, cep, token from usuario where login = ?", [login]);
			let row;
			let ok: boolean;

			if (!rows || !rows.length || !(row = rows[0]) || !(ok = await GeradorHash.validarSenha(senha, row.senha))) {
				r = "Usuário ou senha inválidos";
				return;
			}

            let [token, cookieStr] = Usuario.gerarTokenCookie(row.idUsuario);

            await sql.query("update usuario set token = ? where idUsuario = ?", [token, row.idUsuario]);

			u = new Usuario();
			u.idUsuario = row.idUsuario;
			u.login = login;
            u.nome = row.nome as string;
            u.senha = row.senha as string;
            u.email = row.email as string;
            u.endereco = row.endreco as string;
            u.cep = row.cep as string;
            u.cookieStr = cookieStr;

            Usuario.cacheUsuarioLogados.set(row.idUsuario, u);

			res.cookie("usuario", cookieStr, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true, path: "/", secure: false });
		});

		return [r, u];
	}

	public async efetuarLogout(res: express.Response): Promise<void> {
		await Sql.conectar(async (sql: Sql) => {
            await sql.query("update usuario set token = null where idUsuario = ?", [this.idUsuario]);

			Usuario.cacheUsuarioLogados.del(this.idUsuario);

			res.cookie("usuario", "", { expires: new Date(0), httpOnly: true, path: "/", secure: false });
		});
	}

	public async alterarPerfil(res: express.Response, nome: string, senhaAtual: string, novaSenha: string): Promise<string> {
		nome = (nome || "").trim().toUpperCase();
		if (nome.length < 3 || nome.length > 100)
			return "Nome inválido";

		if (!!senhaAtual !== !!novaSenha || (novaSenha && novaSenha.length > 20))
			return "Senha inválida";

		let r: string = null;

		await Sql.conectar(async (sql: Sql) => {
			if (senhaAtual) {
                let hash = await sql.scalar("select senha from usuario where idUsuario = ?", [this.idUsuario]) as string;
				if (!await GeradorHash.validarSenha(senhaAtual, hash)) {
					r = "Senha atual não confere";
					return;
				}

				hash = await GeradorHash.criarHash(novaSenha);

				let [token, cookieStr] = Usuario.gerarTokenCookie(this.idUsuario);

                await sql.query("update usuario set nome = ?, senha = ?, token = ? where idUsuario = ?", [nome, hash, token, this.idUsuario]);

				this.nome = nome;
				this.cookieStr = cookieStr;

				res.cookie("usuario", cookieStr, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true, path: "/", secure: false });
			} else {
                await sql.query("update usuario set nome = ? where idUsuario = ?", [nome, this.idUsuario]);

				this.nome = nome;
			}
		});

		return r;
	}

	private static validar(u: Usuario): string {
		u.nome = (u.nome || "").trim().toUpperCase();
		if (u.nome.length < 3 || u.nome.length > 100)
			return "Nome inválido";

		return null;
	}

	public static async listar(): Promise<Usuario[]> {
		let lista: Usuario[] = null;

		await Sql.conectar(async (sql: Sql) => {
            lista = await sql.query("select idUsuario, login, nome, case tipo when 0 then 'ADMIN' else 'COMUM' end tipo from usuario order by login asc") as Usuario[];
		});

		return (lista || []);
	}

    public static async obter(idUsuario: number): Promise<Usuario> {
		let lista: Usuario[] = null;

		await Sql.conectar(async (sql: Sql) => {
            lista = await sql.query("select idUsuario, login, nome, tipo from usuario where idUsuario = ?", [idUsuario]) as Usuario[];
		});

		return ((lista && lista[0]) || null);
	}

	public static async criar(u: Usuario): Promise<string> {
		let res: string;
		if ((res = Usuario.validar(u)))
			return res;

		u.login = (u.login || "").trim().toUpperCase();
		if (u.login.length < 3 || u.login.length > 50)
			return "Login inválido";

		await Sql.conectar(async (sql: Sql) => {
            try {
                await sql.query("insert into usuario (login, nome, email, endereco, cep, senha) values (?, ?, ?, ?, ?, ?)", [u.login, u.nome, u.email, u.endereco, u.cep, await GeradorHash.criarHash(u.senha)]);
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					res = `O login "${u.login}" já está em uso`;
				else
					throw e;
			}
		});

		return res;
	}

	public static async alterar(u: Usuario): Promise<string> {
		let res: string;
		if ((res = Usuario.validar(u)))
			return res;

		await Sql.conectar(async (sql: Sql) => {
            await sql.query("update usuario set nome = ?, tipo = ? where idUsuario = ?", [u.nome, u.idUsuario]);
			if (sql.linhasAfetadas) {
				Usuario.cacheUsuarioLogados.del(u.idUsuario);
			} else {
				res = "Usuário inexistente";
			}
		});

		return res;
	}

    public static async excluir(idUsuario: number): Promise<string> {
		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
            await sql.query("delete from usuario where idUsuario = ?", [idUsuario]);
			if (sql.linhasAfetadas) {
                Usuario.cacheUsuarioLogados.del(idUsuario);
			} else {
				res = "Usuário inexistente";
			}
		});

		return res;
	}

    public static async redefinirSenha(idUsuario: number): Promise<string> {
		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
            await sql.query("update usuario set token = null, senha = ? where idUsuario = ?", [Usuario.HashSenhaPadrao, idUsuario]);
			if (sql.linhasAfetadas) {
                Usuario.cacheUsuarioLogados.del(idUsuario);
			} else {
				res = "Usuário inexistente";
			}
		});

		return res;
	}
}
