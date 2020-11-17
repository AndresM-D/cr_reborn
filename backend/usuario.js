class Usuario {
    constructor(id_usuario, id_tipoUsuario, usuario_login, password_login, fec_registro, estado) {
        this._id_usuario = id_usuario;
        this._id_tipoUsuario = id_tipoUsuario;
        this._usuario_login = usuario_login;
        this._password_login = password_login;
        this._fec_registro = fec_registro;
        this._estado = estado;
    }
}

module.exports = Usuario;