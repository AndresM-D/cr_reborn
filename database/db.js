const sql = require('mssql')

const config = {
    user: 'cr_reborn',
    password: 'reborn123',
    server: 'localhost',
    database: 'dbCRReborn',
    options:{
        trustedConnection: true,
        enableArithAbort: true,
        instanceName: 'SQLEXPRESS'
    },
    port : 55892
}

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL')
        return pool
    }).catch(error => console.log('Database Connection Failed! Bad Config: ', error))

module.exports = {
    sql, poolPromise
}