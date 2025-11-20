import express from "express";

//rotas
import { customerRouter } from "../customerRouter.js";
import { personalAccessTokenRouter } from "../access/personalAcessTokenRouter.js";

const version1Router = express.Router();

version1Router.use(`/customer`, customerRouter);
version1Router.use(`/token`, personalAccessTokenRouter);

export {version1Router};