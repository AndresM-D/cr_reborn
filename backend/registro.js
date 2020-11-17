class Registro {
    constructor(id_registro, id_visitante, id_centro, registro) {
        this._id_registro = id_registro;
        this._id_visitante = id_visitante;
        this._id_centro = id_centro;
        this._registro = registro;
    }
}

module.exports = Registro;