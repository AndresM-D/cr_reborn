class Centroturistico {
      constructor(id_centro, id_administrador, id_region, id_tipo, nombre_centro, horario, telefono, costo_entrada_adulto, costo_entrada_aMayor, costo_entrada_nino) {
        this._id_centro = id_centro;
        this._id_administrador = id_administrador;
        this._id_region = id_region;
        this._id_tipo = id_tipo;
        this._nombre_centro = nombre_centro;
        this._horario = horario;
        this._telefono = telefono;
        this._costo_entrada_adulto = costo_entrada_adulto;
        this._costo_entrada_aMayor = costo_entrada_aMayor;
        this._costo_entrada_nino = costo_entrada_nino;
    }
}

module.exports = Centroturistico;