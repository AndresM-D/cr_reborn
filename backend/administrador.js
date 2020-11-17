class Administrador {
    constructor(id_administrador, id_usuario, nombre, apellido, correo) {
        this._id_administrador = id_administrador;
        this._id_usuario = id_usuario;
        this._nombre = nombre;
        this._apellido = apellido;
        this._correo = correo;
    }
}

module.exports = Administrador;