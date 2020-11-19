const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const morgan = require('morgan')
const router = require('./routes/route')
const app = express()
const controller = require('./controller/controller')
const {sql, poolPromise} = require('./database/db')
var rawdata = fs.readFileSync('./query/queries.json');
var queries = JSON.parse(rawdata);

app.use(express.static(__dirname + '/public'))
app.use(express.static(__dirname + '/public/html'))

app.use(cors())

//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

//parse application/json
app.use(bodyParser.json())

app.use(morgan('dev'))

app.post('/addUser', (req, res) => {
    console.log("Trying to create a new user...")

    console.log("Name: " + req.body.usuario_nombre)
    const id_usuario = 8
    const id_tipoUsuario = 2
    const usuario_nombre = req.body.usuario_nombre
    const usuario_apellido = req.body.usuario_apellido
    const usuario_login = req.body.usuario_login
    const password_login = req.body.password_login
    const estado = "1"

    const queryString = "INSERT INTO [dbo].[Usuario] (id_usuario,id_tipoUsuario,usuario_login,password_login,estado) VALUES (@id_usuario,@id_tipoUsuario,@usuario_login,@password_login,@estado)"
    sql.config.query(queryString, [id_usuario, id_tipoUsuario, usuario_login, password_login, estado], (error, results, fields) => {
        if (error) {
            console.log("Failed to insert new Usuario: " + error)
            res.sendStatus(500)
            return
        }
        console.log("Inserted a new Usuario with id: ", results.id);
        res.end()
    })
})

//create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, '/logs/access.log'), {flags: 'a'})

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