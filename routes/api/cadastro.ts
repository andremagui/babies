import express = require("express");
import wrap = require("express-async-error-wrapper");
import jsonRes = require("../../utils/jsonRes");
import Usuario = require("../../models/usuario");
import Cadastro = require("../../models/cadastro");

const router = express.Router();

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
    let u = await Usuario.cookie(req, res);
    if (!u)
        return;
    res.json(await Cadastro.listar(u));
}));

router.get("/obter", wrap(async (req: express.Request, res: express.Response) => {
    let u = await Usuario.cookie(req, res);
    if (!u)
        return;
    let idCadastro = parseInt(req.query["idCadastro"]);
    res.json(isNaN(idCadastro) ? null : await Cadastro.obter(idCadastro));
}));

router.post("/criar", wrap(async (req: express.Request, res: express.Response) => {
    let u = await Usuario.cookie(req, res);
    if (!u)
        return;
    let c = req.body as Cadastro;
    if (c) {
        c.idUsuario = u.idUsuario;
        c.tipo = parseInt(req.body.tipo);
        c.estado = parseInt(req.body.estado);
        c.valor = parseInt(req.body.valor);
        c.faixaetaria = parseInt(req.body.faixaetaria);
        c.acao = parseInt(req.body.acao);
        c.peso = parseInt(req.body.peso);
        c.genero = parseInt(req.body.genero);
    }

    let erro = await Cadastro.criar(u, c);
    if (erro) {
        res.statusCode = 400;
        res.json(erro);
    } else {
        res.sendStatus(204);
    }
}));

router.post("/alterar", wrap(async (req: express.Request, res: express.Response) => {
    let u = await Usuario.cookie(req, res);
    if (!u)
        return;
    let c = req.body as Cadastro;
    if (c) {
        c.idCadastro = parseInt(req.body.idCadastro);
        c.idUsuario = u.idUsuario;
        c.tipo = parseInt(req.body.tipo);
        c.estado = parseInt(req.body.estado);
        c.valor = parseInt(req.body.valor);
        c.faixaetaria = parseInt(req.body.faixaetaria);
        c.acao = parseInt(req.body.acao);
        c.peso = parseInt(req.body.peso);
        c.genero = parseInt(req.body.genero);
    }

    if (c && !isNaN(c.idCadastro)) {
        let erro = await Cadastro.alterar(c);
        if (erro) {
            res.statusCode = 400;
            res.json(erro);
        } else {
            res.sendStatus(204);
        }
    } else {
        res.statusCode = 400;
        res.json("Dados inválidos");
    }
}));

router.get("/excluir", wrap(async (req: express.Request, res: express.Response) => {
    let u = await Usuario.cookie(req, res);
    if (!u)
        return;
    let idCadastro = parseInt(req.query["idCadastro"]);

    if (!isNaN(idCadastro)) {
        let erro = await Cadastro.excluir(idCadastro);
        if (erro) {
            res.statusCode = 400;
            res.json(erro);
        } else {
            res.sendStatus(204);
        }
    } else {
        res.statusCode = 400;
        res.json("Dados inválidos");
    }

    // O if/else acima ficaria assim com o jsonRes: jsonRes(res, 400, !isNaN(id) ? await Curso.excluir(id) : "Dados inválidos");
}));

export = router;
