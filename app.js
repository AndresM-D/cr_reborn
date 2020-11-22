const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const morgan = require('morgan')
const router = require('./routes/route')
const app = express()
const {sql, poolPromise, config} = require('./database/db')
const rawdata = fs.readFileSync('./query/queries.json')
const queries = JSON.parse(rawdata)
const {check, validationResult} = require('express-validator')

app.use(express.static(__dirname + '/public'))
app.use(express.static(__dirname + '/public/html'))

app.use(cors())

//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

//parse application/json
app.use(bodyParser.json())

app.use(morgan('dev'))

//GET register page
app.get('/register', function (req, res, next) {
    res.sendFile(path.join(__dirname + '/public/html/register.html'))
})

//TODO: register validitation from backend to frontend
//Receives and stores a new Usuario from register page
app.post('/register', (req, res) => {

    //data from input's form
    let id_usuario = ''

    //const id_visitante = 2

    //when a Usuario is stored from register, id_tipoUsuario remains as 2 always!
    const id_tipoUsuario = 2

    const nombre = req.body.nombre
    const apellido = req.body.apellido
    const usuario_login = req.body.usuario_login
    const password_login = req.body.password_login

    //same as id_tipoUsuario, estado remains as 1
    const estado = "1"

    //Usuario insertion into db
    sql.connect(config).then(pool => {
        return pool.request()
            .input('id_tipoUsuario', sql.Int, id_tipoUsuario)
            .input('usuario_login', sql.NVarChar, usuario_login)
            .input('password_login', sql.NVarChar, password_login)
            .input('estado', sql.NVarChar, estado)
            .query(queries.addUsuario)
    }).then(result => {
        console.log("Usuario have been created: ", result.rowsAffected)
        sql.connect(config).then(pool => {
            return pool.request()
                .input('usuario_login', sql.NVarChar, usuario_login)
                .query('SELECT id_usuario FROM Usuario WHERE usuario_login = @usuario_login')
        }).then(result => {
            let output = result.recordset

            for (let i = 0; i < output.length; i++) {
                let id = output[i]
                for (let idKey in id) {
                    id_usuario = id[idKey]
                }
            }

            //Visitante insertion into db
            sql.connect(config).then(pool => {
                return pool.request()
                    .input('id_usuario', sql.Int, parseInt(id_usuario))
                    .input('nombre', sql.NVarChar, nombre)
                    .input('apellido', sql.NVarChar, apellido)
                    .input('correo', sql.NVarChar, usuario_login)
                    .query(queries.addVisitante)
            }).then(result => {
                console.log("Visitante have been created: ", result.rowsAffected);
            }).catch(error => {
                console.log("Failed to create new Visitante: " + error)
                res.sendStatus(500)
                return
            })

        }).catch(error => {
            console.log(error)
            return
        })
    }).catch(error => {
        console.log("Failed to create new Usuario: " + error)
        res.sendStatus(500)
        return
    })

//important... otherwise page falls into a endless loop trying to response something
    res.end()
})


//TODO: right now this function is doing nothing
function alreadyHaveEmail(email) {

    app.post('/register', (req, res) => {

        const usuario_login = req.body.usuario_login

        email = usuario_login

        sql.connect(config).then(pool => {
            return pool.request()
                .input('usuario_login', sql.NVarChar, usuario_login)
                .query("SELECT id_usuario FROM Usuario WHERE usuario_login = @usuario_loign")
        }).then(result => {
            if (result && result.length) {
                return true
            } else {
                return false
            }
        }).catch(error => {
            console.log(error)
        })
    })
}


//create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, '/logs/access.log'), {flags: 'a'})

//setup the logger
app.use(morgan('combined', {stream: accessLogStream}))

app.use(router)

const port = 3000

app.listen(process.env.PORT || port, (error) => {
    if (error)
        console.log('Unable to start the server!')
    else
        console.log('Server started running on: ' + port)
})