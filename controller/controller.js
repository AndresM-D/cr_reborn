const {sql, poolPromise} = require('../database/db')
const fs = require('fs');
var rawdata = fs.readFileSync('./query/queries.json');
var queries = JSON.parse(rawdata);

class MainController {

    async getAllData(req, res) {
        try {
            const pool = await poolPromise
            const result = await pool.request()
                .query(queries.getAllData)
            res.json(result.recordset)
        } catch (error) {
            res.status(500)
            res.send(error.message)
        }
    }

    async addNewData(req, res) {
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
                    .query(queries.addNewUser)
                res.json(result)

            } else {
                res.send('Please fill all the details!')
            }
        } catch (error) {
            res.status(500)
            res.send(error.message)
        }
    }

    async updateData(req, res) {
        try {
            if (req.body.password_login != null &&
                req.body.id_usuario != null)
            {
                const pool = await poolPromise
                const result = await pool.request()
                    .input('password_login', sql.NVarChar, req.body.password_login)
                    .input('id_usuario', sql.NVarChar, req.body.id_usuario)
                    .query(queries.updateUser)
                res.json(result)
            } else {
                res.send('All fields are required!')
            }
        } catch (error) {
            res.status(500)
            res.send(error.message)
        }
    }

    async deleteData(req, res) {
        try {
            if (req.body.id_usuario != null){
                const pool = await poolPromise
                const result = await pool.request()
                    .input('id_usuario', sql.Int, req.body.id_usuario)
                    .query(queries.deleteUser)
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