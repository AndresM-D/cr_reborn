class Visitante {
    constructor(id_visitante, id_usuario, nombre, apellido, correo) {
        this._id_visitante = id_visitante;
        this._id_usuario = id_usuario;
        this._nombre = nombre;
        this._apellido = apellido;
        this._correo = correo;
    }
}

module.exports = Visitante;