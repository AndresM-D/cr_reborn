var config = require('./dbconfig');
const sql = require('mssql');

//GET methods
async function getTipoUsuario() {
    try {
        let pool = await sql.connect(config);
        let tipoUsuario = await pool.request().query("SELECT * from TipoUsuario");
        return tipoUsuario.recordsets;
    } catch (error) {
        console.log(error);
    }
}

async function getTipoUsuarioID(id) {
    try {
        let pool = await sql.connect(config);
        let tipoUsuario = await pool.request()
            .input('input_parameter', sql.Int, id)
            .query("SELECT * from TipoUsuario where id_tipoUsuario = @input_parameter");
        return tipoUsuario.recordsets;
    } catch (error) {
        console.log(error);
    }
}

//TODO: methods that receive id as param

async function getUsuario() {
    try {
        let pool = await sql.connect(config);
        let usuario = await pool.request().query("SELECT * from Usuario");
        return usuario.recordsets;
    } catch (error) {
        console.log(error);
    }
}

async function getAdministrador() {
    try {
        let pool = await sql.connect(config);
        let administrador = await pool.request().query("SELECT * from Administrador");
        return administrador.recordsets;
    } catch (error) {
        console.log(error);
    }
}

async function getVisitante() {
    try {
        let pool = await sql.connect(config);
        let visitante = await pool.request().query("SELECT * from Visitante");
        return visitante.recordsets;
    } catch (error) {
        console.log(error);
    }
}


async function getTipoCentro() {
    try {
        let pool = await sql.connect(config);
        let tipoCentros = await pool.request().query("SELECT * from TipoCentro");
        return tipoCentros.recordsets;
    } catch (error) {
        console.log(error);
    }
}

async function getServicio() {
    try {
        let pool = await sql.connect(config);
        let servicios = await pool.request().query("SELECT * from Servicio");
        return servicios.recordsets;
    } catch (error) {
        console.log(error);
    }
}

async function getCentroServicio() {
    try {
        let pool = await sql.connect(config);
        let centroServicio = await pool.request().query("SELECT * from CentroServicio");
        return centroServicio.recordsets;
    } catch (error) {
        console.log(error);
    }
}

async function getRegion() {
    try {
        let pool = await sql.connect(config);
        let region = await pool.request().query("SELECT * from Region");
        return region.recordsets;
    } catch (error) {
        console.log(error);
    }
}

async function getCentroTuristico() {
    try {
        let pool = await sql.connect(config);
        let centroTuristico = await pool.request().query("SELECT * from CentroTuristico");
        return centroTuristico.recordsets;
    } catch (error) {
        console.log(error);
    }
}

async function getRegistro() {
    try {
        let pool = await sql.connect(config);
        let registro = await pool.request().query("SELECT * from Registro");
        return registro.recordsets;
    } catch (error) {
        console.log(error);
    }
}

//POST methods
async function addUsuario(usuario) {
    try {
        let pool = await sql.connect(config);
        let insertUsuario = await pool.request()
            .input('id_tipoUsuario', sql.Int, usuario._id_tipoUsuario)
            .input('usuario_login', sql.NVarChar, usuario._usuario_login)
            .input('password_login', sql.NVarChar, usuario._password_login)
            .input('fec_registro', sql.Date, usuario._fec_registro)
            .input('estado', sql.NVarChar, usuario._estado)
            .execute('InsertUsuario');
        return insertUsuario.recordset;
    } catch (error) {
        console.log(error);
    }
}

//exports
module.exports = {
    //GET
    getTipoUsuario: getTipoUsuario,
    getTipoUsuarioID: getTipoUsuarioID,
    getUsuario: getUsuario,
    getAdministrador: getAdministrador,
    getVisitante: getVisitante,
    getTipoCentro: getTipoCentro,
    getServicio: getServicio,
    getCentroServicio: getCentroServicio,
    getRegion: getRegion,
    getCentroTuristico: getCentroTuristico,
    getRegistro: getRegistro,

    //POST
    addUsuario: addUsuario
}