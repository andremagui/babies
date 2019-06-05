import Sql = require("../infra/sql");
import FS = require("../infra/fs");
import Upload = require("../infra/upload");
import Usuario = require("./Usuario");

export = class Cadastro {
    public idCadastro: number;
	public idUsuario: number;
    public descricao: string;
    public tipo: number;
    public estado: number;
    public valor: number;
    public faixaetaria: number;
    public acao: number;
    public peso: number;
    public genero: number;
    public extensao: string;

	public static readonly caminhoRelativo = "dados/cadastro";
	public static readonly caminhoAbsolutoExterno = "/api/cadastro/foto";

    private static validar(c: Cadastro, criacao: boolean): string {
        if (c.idUsuario <= 0)
            return "Usuário inválido";

        c.descricao = (c.descricao || "").trim().toUpperCase();
        if (c.descricao.length < 3 || c.descricao.length > 100)
            return "Descrição do item inválida";

        if (c.tipo > 3 || c.tipo < 1)
            return "Escolha inválida";

        if (c.estado > 4 || c.estado < 1)
            return "Escolha inválida";

        if (c.valor <= 0)
            return "Escolha inválida";

        if (c.faixaetaria > 10 || c.faixaetaria < 1)
            return "Escolha inválida";

        if (c.acao > 2 || c.acao < 1)
            return "Escolha inválida";

        if (c.peso > 20 || c.peso < 1)
            return "Escolha inválida";

        if (c.genero > 2 || c.genero < 1)
            return "Escolha inválida";

		if (criacao) {
			// Só valida a extensão do arquivo durante a criação, pois durante a alteração,
			// a extensão do arquivo não muda.
			if (!c.extensao)
				return "Extensão de arquivo inválida";
		}

		return null;
	}

	public static async listar(u: Usuario): Promise<Cadastro[]> {
		let lista: Cadastro[] = null;

        await Sql.conectar(async (sql: Sql) => {
            lista = await sql.query("select c.idCadastro, c.idUsuario, c.descricao, t.descricao as tipo, e.descricao as estado, valor, f.descricao as faixaetaria, a.descricao as acao, peso, g.descricao as genero from cadastro as c inner join tipo as t on t.id = c.tipo inner join estado as e on e.id = c.estado inner join faixaetaria as f on f.id = c.faixaetaria inner join acao as a on a.id = c.acao inner join genero as g on g.id = c.genero where c.idUsuario = ? order by c.descricao asc;", [u.idUsuario]) as Cadastro[];
		});

		return (lista || []);
	}

    public static async obter(idCadastro: number): Promise<Cadastro> {
		let lista: Cadastro[] = null;

		await Sql.conectar(async (sql: Sql) => {
            lista = await sql.query("select idCadastro, idUsuario, descricao, tipo, estado, valor, faixaetaria, acao, peso, genero from cadastro where idCadastro = ?", [idCadastro]) as Cadastro[];
		});

		return ((lista && lista[0]) || null);
	}

	public static async criar(u: Usuario, c: Cadastro): Promise<string> {
        c.idUsuario = u.idUsuario;
		//switch (arquivo.mimetype) {
		//	case "image/png":
		//		c.extensao = "png";
		//		break;
		//	case "image/jpeg":
		//		c.extensao = "jpg";
		//		break;
		//	default:
		//		c.extensao = null;
		//		break;
		//}

		let res: string;
		if ((res = Cadastro.validar(c, true)))
			return res;

		await Sql.conectar(async (sql: Sql) => {
			// Cria uma transação para podermos dar rollback em caso de falha na criação do arquivo
			await sql.beginTransaction();

            try {
                await sql.query("insert into cadastro (idUsuario, descricao, tipo, estado, valor, faixaetaria, acao, peso, genero) values (?, ?, ?, ?, ?, ?, ?, ?, ?)", [u.idUsuario, c.descricao, c.tipo, c.estado, c.valor, c.faixaetaria, c.acao, c.peso, c.genero]);
				// Obtém o id do último cadastro inserido
				c.idCadastro = await sql.scalar("select last_insert_idCadastro()") as number;

				// Chegando aqui, significa que a inclusão foi bem sucedida.
				// Logo, podemos tentar criar o arquivo físico. Se a criação do
				// arquivo não funcionar, uma exceção ocorrerá, e a transação será
				// desfeita, já que o método commit() não executará, e nossa classe
				// Sql já executa um rollback() por nós nesses casos.
				//await Upload.gravarArquivo(arquivo, Cadastro.caminhoRelativo, c.idCadastro + "." + c.extensao);

				await sql.commit();
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					res = `O cadastro "${c.idCadastro}" já existe`;
				else
					throw e;
			}
		});

		return res;
	}

	public static async alterar(c: Cadastro): Promise<string> {
		let res: string;
		if ((res = Cadastro.validar(c, false)))
			return res;

		await Sql.conectar(async (sql: Sql) => {
			try {
                await sql.query("update cadastro set descricao = ?, tipo = ?, estado = ?, valor = ?, faixaetaria = ?, acao = ?, peso = ?, genero = ? where idCadastro = ?", [c.descricao, c.tipo, c.estado, c.valor, c.faixaetaria, c.acao, c.peso, c.genero, c.idCadastro]);
				if (!sql.linhasAfetadas)
					res = "Cadastro inexistente";
			} catch (e) {
				if (e.code && e.code === "ER_DUP_ENTRY")
					res = `O cadastro "${c.idCadastro}" já existe`;
				else
					throw e;
			}
		});

		return res;
	}

    public static async excluir(idCadastro: number): Promise<string> {
		let res: string = null;

		await Sql.conectar(async (sql: Sql) => {
			// Cria uma transação para podermos dar rollback em caso de falha na exclusão do arquivo
			await sql.beginTransaction();

			//let extensao = await sql.scalar("select extensao from cadastro where idCadastro = ?", [c]) as string;

			//if (!extensao) {
			//	res = "Cadastro inexistente";
            //} else {
                await sql.query("delete from cadastro where idCadastro = ?", [idCadastro]);

				if (!sql.linhasAfetadas) {
					res = "Cadastro inexistente";
				} else {
					// Chegando aqui, significa que a exclusão foi bem sucedida.
					// Logo, podemos tentar excluir o arquivo físico. Se a exclusão do
					// arquivo não funcionar, uma exceção ocorrerá, e a transação será
					// desfeita, já que o método commit() não executará, e nossa classe
					// Sql já executa um rollback() por nós nesses casos.
					//let caminho = `${Cadastro.caminhoRelativo}/${c}.${extensao}`;
					//if (await FS.existeArquivo(caminho))
					//	await FS.excluirArquivo(caminho);
				}
			//}

			sql.commit();
		});

		return res;
	}
}
