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

//GET registerAdmin page
app.get('/registerAdmin', forwardAuthenticated, (req, res) => {
    res.render('registerAdmin.ejs')
})

//GET editAdmin page
app.get('/editarAdmin', forwardAuthenticated, (req, res) => {
    let pass = ' '
    let email_ = ' '
    let idUser=8
    sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .query('SELECT * FROM Usuario WHERE id_usuario = @id_usuario')
    }).then(result => {
        pass = result.recordset[0].password_login
        email_ = result.recordset[0].usuario_login
        console.log(email_)
        sql.connect(config).then(pool => {
            return pool.request()
                .input('id_usuario', sql.Int, parseInt(idUser))
                .query('SELECT * FROM Administrador WHERE id_usuario = @id_usuario')
        }).then(result => {
            res.render('editarAdmin.ejs', {name:result.recordset[0].nombre, lastname:result.recordset[0].apellido, email__: email_, passw:pass})

        })


    })


})

//POST delete
app.post('/eliminarAdmin', async (req, res) => {
    let idUser=8
    sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .query("DELETE FROM Administrador WHERE id_usuario = @id_usuario")

    }).then(result => {
        console.log("Admin have been deleted: ", result.rowsAffected);
        sql.connect(config).then(pool => {
            return pool.request()
                .input('id_usuario', sql.Int, parseInt(idUser))
                .query("UPDATE Usuario SET estado = 2 WHERE id_usuario = @id_usuario\"")
        }).then(result => {
            console.log("User have been deactivated: ", result.rowsAffected);


        })

    })

    req.flash('success', 'Administrator was deleted!')
    res.redirect('/editarAdmin')


})

//POST edit
app.post('/editarAdmin', async (req, res) => {

    let id_usuario = ''
    const nombre = req.body.nombre
    const apellido = req.body.apellido
    const usuario_login = req.body.usuario_login
    const password_login = req.body.password_login
    let idUser=8
    sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .input('nombre', sql.NVarChar, nombre)
            .input('apellido', sql.NVarChar, apellido)
            .input('correo', sql.NVarChar, usuario_login)
            .query(queries.updateAdministrador)
    }).then(result => {
        console.log("Admin have been update: ", result.rowsAffected);
        sql.connect(config).then(pool => {
            return pool.request()
                .input('passw', sql.NVarChar, password_login)
                .input('id_usuario', sql.Int, parseInt(idUser))
                .input('correo', sql.NVarChar, usuario_login)
                .query(queries.updateAdministradorClave)
        }).then(result => {
            console.log("Usuario have been updated: ", result.rowsAffected);

        })

    })
    req.flash('success', 'Successful!')
    res.redirect('/editarAdmin')


})


//GET registerLugar page
app.get('/registerLugar', forwardAuthenticated, (req, res) => {
    res.render('registerLugar.ejs')
})

//POST registerLugar
app.post('/registerLugar', async (req, res) => {

    let id_tipo = ''
    let id_region = ''
    let id_servicios = ''
    let id_centro = ''
    const nombre = req.body.nombre
    const ubicacion = req.body.ubicacion
    const region = req.body.region
    const tipo = req.body.tipo
    const horario = req.body.horario
    const telefono = req.body.telefono
    const costoA = req.body.costoA
    const costoN = req.body.costoN
    const costoM = req.body.costoM
    const servicios = req.body.servicios
    const login = 3

                sql.connect(config).then(pool => {
                    return pool.request()
                        .input('tipo', sql.NVarChar, tipo)
                        .query('INSERT INTO TipoCentro (nombre_tipo) VALUES (@tipo)')
                }).then(result => {

                    console.log("Tipo have been created: ", result.rowsAffected)

                    sql.connect(config).then(pool => {
                        return pool.request()
                            .input('region', sql.NVarChar, region)
                            .input('ubicacion', sql.NVarChar, ubicacion)
                            .query('INSERT INTO Region (nombre_region, provincia) VALUES (@region, @ubicacion)')
                    }).then(result => {

                        console.log("Region have been created: ", result.rowsAffected)

                        sql.connect(config).then(pool => {
                            return pool.request()
                                .input('servicios', sql.NVarChar, servicios)
                                .query('INSERT INTO Servicio (nombre_servicio) VALUES (@servicios)')
                        }).then(result => {

                            console.log("Servicios have been created: ", result.rowsAffected)
                            sql.connect(config).then(pool => {
                                return pool.request()
                                    .query('SELECT TOP 1 id_tipo FROM TipoCentro ORDER BY id_tipo DESC')
                            }).then(result => {
                                id_tipo=result.recordset[0].id_tipo
                                sql.connect(config).then(pool => {
                                    return pool.request()
                                        .query('SELECT TOP 1 id_region FROM Region ORDER BY id_region DESC')
                                }).then(result => {

                                    id_region=result.recordset[0].id_region
                                    sql.connect(config).then(pool => {
                                        return pool.request()
                                            .query('SELECT TOP 1 id_servicio FROM Servicio ORDER BY id_servicio DESC')
                                    }).then(result => {

                                        id_servicios=result.recordset[0].id_servicio
                                        sql.connect(config).then(pool => {
                                            return pool.request()
                                                .input('id_tipo', sql.Int, id_tipo)
                                                .input('id_region', sql.NVarChar, id_region)
                                                .input('id_servicios', sql.NVarChar, id_servicios)
                                                .input('nombre', sql.NVarChar, nombre)
                                                .input('horario', sql.NVarChar, horario)
                                                .input('telefono', sql.NVarChar, telefono)
                                                .input('costoA', sql.NVarChar, costoA)
                                                .input('costoN', sql.NVarChar, costoN)
                                                .input('costoM', sql.NVarChar, costoM)
                                                .input('login', sql.NVarChar, login)
                                                .query("INSERT INTO CentroTuristico (id_administrador, id_region, id_tipo, nombre_centro, horario, telefono, costo_entrada_adulto,costo_entrada_aMayor,costo_entrada_nino ) VALUES (@login, @id_region, @id_tipo,@nombre, @horario,@telefono,@costoA,@costoM,@costoN)")
                                        }).then(result => {

                                            console.log("Centro Turistico: ", result.rowsAffected)
                                            sql.connect(config).then(pool => {
                                                return pool.request()
                                                    .query('SELECT TOP 1 id_centro FROM CentroTuristico ORDER BY id_centro DESC')
                                            }).then(result => {

                                                id_centro=result.recordset[0].id_centro
                                                sql.connect(config).then(pool => {
                                                    return pool.request()
                                                        .input('id_servicio', sql.NVarChar, id_servicios)
                                                        .input('id_centro', sql.NVarChar, id_centro)
                                                        .query('INSERT INTO CentroServicio (id_servicio,id_centro) VALUES (@id_servicio,@id_centro)')
                                                }).then(result => {

                                                    console.log("Centro Turistico Agregado con EXITO: ", result.rowsAffected)
                                                })
                                                   })

                                        })

                                    })

                                })


                            })

                        })

                    })

                        })



    req.flash('success', 'Centro turistico creado con exito!')
    res.redirect('/registerLugar')

})


//GET editAdmin page
app.get('/editarAdmin', forwardAuthenticated, (req, res) => {
    let pass = ' '
    let email_ = ' '
    let idUser=8
    sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .query('SELECT * FROM Usuario WHERE id_usuario = @id_usuario')
    }).then(result => {
        pass = result.recordset[0].password_login
        email_ = result.recordset[0].usuario_login
        console.log(email_)
        sql.connect(config).then(pool => {
            return pool.request()
                .input('id_usuario', sql.Int, parseInt(idUser))
                .query('SELECT * FROM Administrador WHERE id_usuario = @id_usuario')
        }).then(result => {
            res.render('editarAdmin.ejs', {name:result.recordset[0].nombre, lastname:result.recordset[0].apellido, email__: email_, passw:pass})

        })


    })


})

//POST delete
app.post('/eliminarAdmin', async (req, res) => {
    let idUser=8
    sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .query("DELETE FROM Administrador WHERE id_usuario = @id_usuario")

    }).then(result => {
        console.log("Admin have been deleted: ", result.rowsAffected);
        sql.connect(config).then(pool => {
            return pool.request()
                .input('id_usuario', sql.Int, parseInt(idUser))
                .query("UPDATE Usuario SET estado = 2 WHERE id_usuario = @id_usuario\"")
        }).then(result => {
            console.log("User have been deactivated: ", result.rowsAffected);


        })

    })

    req.flash('success', 'Administrator was deleted!')
    res.redirect('/editarAdmin')


})

//POST edit
app.post('/editarAdmin', async (req, res) => {

    let id_usuario = ''
    const nombre = req.body.nombre
    const apellido = req.body.apellido
    const usuario_login = req.body.usuario_login
    const password_login = req.body.password_login
    let idUser=8
    sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .input('nombre', sql.NVarChar, nombre)
            .input('apellido', sql.NVarChar, apellido)
            .input('correo', sql.NVarChar, usuario_login)
            .query(queries.updateAdministrador)
    }).then(result => {
        console.log("Admin have been update: ", result.rowsAffected);
        sql.connect(config).then(pool => {
            return pool.request()
                .input('passw', sql.NVarChar, password_login)
                .input('id_usuario', sql.Int, parseInt(idUser))
                .input('correo', sql.NVarChar, usuario_login)
                .query(queries.updateAdministradorClave)
        }).then(result => {
            console.log("Usuario have been updated: ", result.rowsAffected);

        })

    })
    req.flash('success', 'Successful!')
    res.redirect('/editarAdmin')


})




//GET edit page
app.get('/editarUser', forwardAuthenticated, (req, res) => {
    let pass = ' '
    let email_ = ' '
    let idUser=6
    sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .query('SELECT * FROM Usuario WHERE id_usuario = @id_usuario')
    }).then(result => {
        pass = result.recordset[0].password_login
        email_ = result.recordset[0].usuario_login
        console.log(email_)
        sql.connect(config).then(pool => {
            return pool.request()
                .input('id_usuario', sql.Int, parseInt(idUser))
                .query('SELECT * FROM Visitante WHERE id_usuario = @id_usuario')
        }).then(result => {

            res.render('editarUser.ejs', {name:result.recordset[0].nombre, lastname:result.recordset[0].apellido, email__: email_, passw:pass})

        })


    })


})

//POST delete
app.post('/eliminarUser', async (req, res) => {
    let idUser=6
    sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .query("DELETE FROM Visitante WHERE id_usuario = @id_usuario")

    }).then(result => {
        console.log("Admin have been deleted: ", result.rowsAffected);
        sql.connect(config).then(pool => {
            return pool.request()
                .input('id_usuario', sql.Int, parseInt(idUser))
                .query("UPDATE Usuario SET estado = 2 WHERE id_usuario = @id_usuario\"")
        }).then(result => {
            console.log("User have been deactivated: ", result.rowsAffected);


        })

    })

    req.flash('success', 'Administrator was deleted!')
    res.redirect('/editarUser')


})

//POST edit
app.post('/editarUser', async (req, res) => {

    let id_usuario = ''
    let idUser=6
    const nombre = req.body.nombre
    const apellido = req.body.apellido
    const usuario_login = req.body.usuario_login
    const password_login = req.body.password_login
    sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .input('nombre', sql.NVarChar, nombre)
            .input('apellido', sql.NVarChar, apellido)
            .input('correo', sql.NVarChar, usuario_login)
            .query(queries.updateVisitante)
    }).then(result => {
        console.log("Admin have been update: ", result.rowsAffected);
        sql.connect(config).then(pool => {
            return pool.request()
                .input('passw', sql.NVarChar, password_login)
                .input('id_usuario', sql.Int, parseInt(idUser))
                .input('correo', sql.NVarChar, usuario_login)
                .query("UPDATE Usuario SET password_login = @passw, usuario_login = @correo WHERE id_usuario = @id_usuario")
        }).then(result => {
            console.log("Usuario have been updated: ", result.rowsAffected);

        })

    })
    req.flash('success', 'Successful!')
    res.redirect('/editarUser')


})




//POST register
//TODO: register validitation from backend to frontend
//Receives and stores a new Usuario from register page
app.post('/register', async (req, res) => {

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

//POST registerAdmini
//TODO: registerAdmin validitation from backend to frontend
//Receives and stores a new Admin from registerAdmin page
app.post('/registerAdmin', async (req, res) => {

    //getUsuarios()

    //data from input's form
    let id_usuario = ''

    //when a Usuario is stored from register, id_tipoUsuario remains as 2 always!
    const id_tipoUsuario = 1

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
                                .query(queries.addAdministrador)
                        }).then(result => {
                            console.log("Administrador have been created: ", result.rowsAffected);
                        }).catch(error => {
                            //shit happens
                            console.log("Failed to create new Administrador: " + error)
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
            res.redirect('/registerAdmin')
        }
        //if the user is registered... a fancy msg shows up
    } else {
        req.flash('error', 'Email already exist!')
        res.redirect('/registerAdmin')
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
