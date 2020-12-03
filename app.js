if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

//dependencies
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const morgan = require('morgan')
const router = require('./routes/route')
const app = express()
const {sql, config} = require('./database/db')
const rawdata = fs.readFileSync('./query/queries.json')
const queries = JSON.parse(rawdata)
//unused for now, DON'T DELETE LINE BELOW
const bcrypt = require('bcrypt');
const saltRounds = 10;
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const {ensureAuthenticated, forwardAuthenticated} = require('./config/auth')

//ejs render engine
app.set('view-engine', 'ejs')

//paths where express can access all our html pages, images, etc
app.use(express.static(__dirname + '/public'))
app.use(express.static(__dirname + '/public/html'))

app.use(cors())

//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.urlencoded({extended: false}))

//parse application/json
app.use(bodyParser.json())

app.use(morgan('dev'))

app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(session({
    secret: process.env.SESSION_SECRET,
    cookie: {maxAge: 60000},
    resave: false,
    saveUninitialized: false
}))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

//required for storing all users in db into const users
const users = []
const visitors = []
let user

//passport initialization login logic
const initializePassport = require('./passport-config')
//email and id are needed for passport to validate the user credentials typed from view login.ejs
initializePassport(passport,
    //email and id are set from our const users
    email => users.find(user => user.usuario_login === email),
    id => users.find(user => user.id_usuario === id)
)

//method used for pushing users from db into array declared above
async function getUsuarios() {
    await sql.connect(config).then(pool => {
        return pool.request()
            .query(queries.getUsuario)
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            user = output[i]
            users.push(user)
        }
    })
    //console.log(users)
}

function getVisitantes() {
    sql.connect(config).then(pool => {
        return pool.request()
            .query(queries.getVisitante)
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            let visitor = output[i]
            visitors.push(visitor)
        }
        //console.log(visitors)
    })
}

//GET index page
app.get('/', forwardAuthenticated, (req, res) => {
    res.render('index.ejs')
})

//GET login page
app.get('/login', forwardAuthenticated, (req, res) => {
    res.render('login.ejs')
    getUsuarios()
    getVisitantes()
})

//POST login
app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}))

//GET logout function
app.get('/logout', function (req, res) {
    req.logout()
    req.flash('success', 'Logged out!')
    res.redirect('/login')
})

//GET dashboard page
app.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('dashboard.ejs', {name: req.user.usuario_login})
})

//GET register page
app.get('/register', forwardAuthenticated, (req, res) => {
    res.render('register.ejs')
})

//GET successReg page
app.get('/successReg', (req, res) => {
    res.render('successReg.ejs')
})

//POST register
//TODO: register validitation from backend to frontend
//Receives and stores a new Usuario from register page
app.post('/register', async (req, res) => {

    //getUsuarios()

    //data from input's form
    let id_usuario = ''

    //when a Usuario is stored from register, id_tipoUsuario remains as 2 always!
    const id_tipoUsuario = 2

    const nombre = req.body.nombre
    const apellido = req.body.apellido
    const usuario_login = req.body.usuario_login
    const password_login = req.body.password_login

    //same as id_tipoUsuario, estado remains as 1
    const estado = "1"

    //first, we need to validate that a new user cant register if he or she is already in the db so...
    //promise below capture all the users and store it in a array
    await sql.connect(config).then(pool => {
        return pool.request()
            .query(queries.getUsuario)
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            user = output[i]
            users.push(user)
        }
    })

    //then we need to validate the data from register page against our array containing all the users
    const result = users.find(user => user.usuario_login === usuario_login)

    //if the user isn't registered yet
    if (result === undefined) {
        try {
            //Usuario insertion into db
            await bcrypt.hash(password_login, saltRounds, function (err, hash) {
                sql.connect(config).then(pool => {
                    return pool.request()
                        .input('id_tipoUsuario', sql.Int, id_tipoUsuario)
                        .input('usuario_login', sql.NVarChar, usuario_login)
                        .input('password_login', sql.NVarChar, hash)
                        .input('estado', sql.NVarChar, estado)
                        .query(queries.addUsuario)
                }).then(result => {

                    console.log("Usuario have been created: ", result.rowsAffected)
                    //in order to create a Visitante...
                    sql.connect(config).then(pool => {
                        return pool.request()
                            .input('usuario_login', sql.NVarChar, usuario_login)
                            .query('SELECT id_usuario FROM Usuario WHERE usuario_login = @usuario_login')
                    }).then(result => {
                        //the id from last insertion is assigned to result
                        let output = result.recordset

                        //now we need to get that id as an object that can be saved into the db
                        //that's what it does the for loop below
                        for (let i = 0; i < output.length; i++) {
                            let id = output[i]
                            for (let idKey in id) {
                                id_usuario = id[idKey]
                            }
                        }

                        //having the right id from Usuario we need to assign the same id to Visitante record as well
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
                            //shit happens
                            console.log("Failed to create new Visitante: " + error)
                            res.sendStatus(500)
                            return
                        })
                    }).catch(error => {
                        console.log(error)
                        res.sendStatus(500)
                        return
                    })
                }).catch(error => {
                    console.log("Failed to create new Usuario: " + error)
                    res.sendStatus(500)
                    return
                })
            })
            //success register page rendering
            req.flash('success', 'Registration success!')
            res.redirect('/login')
        } catch {
            res.redirect('/register')
        }
        //if the user is registered... a fancy msg shows up
    } else {
        req.flash('error', 'Email already exist!')
        res.redirect('/register')
    }
})

//GET admin page
app.get('/admin', forwardAuthenticated, (req, res) => {
    res.render('loginAdmin.ejs')
})

//POST admin page
app.post('/admin', async (req, res) => {

    const usuario_login = req.body.email
    const password_login = req.body.password
    let idTipoUsuario

    //first, we need to validate that a new user cant register if he or she is already in the db so...
    //promise below capture all the users and store it in a array
    await sql.connect(config).then(pool => {
        return pool.request()
            .query(queries.getUsuario)
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            user = output[i]
            users.push(user)
        }
    })

    const result = []

    //then we need to validate the data from register page against our array containing all the users
    result[0] = users.find(user => user.usuario_login === usuario_login)

    if (result[0] === undefined) {
        req.flash('error', 'Admin not registered!')
        res.redirect('/admin')
    } else {
        idTipoUsuario = result[0].id_tipoUsuario

        if (idTipoUsuario === 1 && password_login === result[0].password_login) {
            req.flash('success', 'Success!')
            res.redirect('/admin')
        } else {
            req.flash('error', 'Wrong credentials!')
            res.redirect('/admin')
        }
    }
})

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
