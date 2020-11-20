const {sql, poolPromise} = require('../database/db')
const fs = require('fs');
var rawdata = fs.readFileSync('./query/queries.json');
var queries = JSON.parse(rawdata);

class MainController {

    //Usuario
    async getUsuario(req, res) {
        try {
            const pool = await poolPromise
            const result = await pool.request()
                .query(queries.getUsuario)
            res.json(result.recordset)
        } catch (error) {
            res.status(500)
            res.send(error.message)
        }
    }

    async addUsuario(req, res) {
        try {
            if (req.body.id_usuario != null &&
                req.body.id_tipoUsuario != null &&
                req.body.usuario_login != null &&
                req.body.password_login != null &&
                req.body.estado != null)
            {
                const pool = await poolPromise
                const result = await pool.request()
                    .input('id_usuario', sql.Int, req.body.id_usuario)
                    .input('id_tipoUsuario', sql.Int, req.body.id_tipoUsuario)
                    .input('usuario_login', sql.NVarChar, req.body.usuario_login)
                    .input('password_login', sql.NVarChar, req.body.password_login)
                    .input('estado', sql.NVarChar, req.body.estado)
                    .query(queries.addUsuario)
                res.json(result)
            } else {
                res.send('Please fill all the details!')
            }
        } catch (error) {
            res.status(500)
            res.send(error.message)
        }
    }

    async updateUsuario(req, res) {
        try {
            if (req.body.password_login != null &&
                req.body.id_usuario != null)
            {
                const pool = await poolPromise
                const result = await pool.request()
                    .input('password_login', sql.NVarChar, req.body.password_login)
                    .input('id_usuario', sql.NVarChar, req.body.id_usuario)
                    .query(queries.updateUsuario)
                res.json(result)
            } else {
                res.send('All fields are required!')
            }
        } catch (error) {
            res.status(500)
            res.send(error.message)
        }
    }

    async deleteUsuario(req, res) {
        try {
            if (req.body.id_usuario != null){
                const pool = await poolPromise
                const result = await pool.request()
                    .input('id_usuario', sql.Int, req.body.id_usuario)
                    .query(queries.deleteUsuario)
                res.json(result)
            } else {
                res.send('Please fill all the details!')
            }
        } catch (error) {
            res.status(500)
            res.send(error.message)
        }
    }

    //Visitante
    async getVisitante(req, res) {
        try {
            const pool = await poolPromise
            const result = await pool.request()
                .query(queries.getVisitante)
            res.json(result.recordset)
        } catch (error) {
            res.status(500)
            res.send(error.message)
        }
    }

    async addVisitante(req, res) {
        try {
            if (req.body.id_visitante != null &&
                req.body.id_usuario != null &&
                req.body.nombre != null &&
                req.body.apellido != null &&
                req.body.correo != null)
            {
                const pool = await poolPromise
                const result = await pool.request()
                    .input('id_visitante', sql.Int, req.body.id_visitante)
                    .input('id_usuario', sql.Int, req.body.id_usuario)
                    .input('nombre', sql.NVarChar, req.body.nombre)
                    .input('apellido', sql.NVarChar, req.body.apellido)
                    .input('correo', sql.NVarChar, req.body.correo)
                    .query(queries.addVisitante)
                res.json(result)
            } else {
                res.send('Please fill all the details!')
            }
        } catch (error) {
            res.status(500)
            res.send(error.message)
        }
    }

    async updateVisitante(req, res) {
        try {
            if (req.body.nombre != null &&
                req.body.apellido != null &&
                req.body.id_visitante != null)
            {
                const pool = await poolPromise
                const result = await pool.request()
                    .input('nombre', sql.NVarChar, req.body.nombre)
                    .input('apellido', sql.NVarChar, req.body.apellido)
                    .input('id_visitante', sql.Int, req.body.id_visitante)
                    .query(queries.updateVisitante)
                res.json(result)
            } else {
                res.send('All fields are required!')
            }
        } catch (error) {
            res.status(500)
            res.send(error.message)
        }
    }

    async deleteVisitante(req, res) {
        try {
            if (req.body.id_visitante != null){
                const pool = await poolPromise
                const result = await pool.request()
                    .input('id_visitante', sql.Int, req.body.id_visitante)
                    .query(queries.deleteVisitante)
                res.json(result)
            } else {
                res.send('Please fill all the details!')
            }
        } catch (error) {
            res.status(500)
            res.send(error.message)
        }
    }

}

const controller = new MainController()
module.exports = controller;