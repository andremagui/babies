import express = require("express");
import wrap = require("express-async-error-wrapper");
import Usuario = require("../models/usuario");
import Cadastro = require("../models/cadastro");

const router = express.Router();

router.all("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u) {
		res.redirect("/");
	} else {
		res.render("cadastro/alterar", { titulo: "Adicionar Produto", usuario: u, item: null });
	}
}));

router.all("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u) {
		res.redirect("/");
	} else {
        let id = parseInt(req.query["idCadastro"]);
		let item: Cadastro = null;
		if (isNaN(id) || !(item = await Cadastro.obter(id)))
			res.render("shared/nao-encontrado", { usuario: u });
		else
			res.render("cadastro/alterar", { titulo: "Editar Produto", usuario: u, item: item });
	}
}));

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u) {
		res.redirect("/");
	} else {
		res.render("cadastro/listar", { titulo: "Meus Produtos", usuario: u, lista: JSON.stringify(await Cadastro.listar(u)) });
	}
}));

export = router;
