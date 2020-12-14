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
const bcrypt = require('bcrypt');
const saltRounds = 10;
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const {ensureAuthenticated, forwardAuthenticated} = require('./config/auth')
const fileUpload = require('express-fileupload')

//ejs render engine
app.set('view-engine', 'ejs')

//paths where express can access all our html pages, images, etc
app.use(express.static(__dirname + '/public'))
app.use(express.static(__dirname + '/public/html'))
app.use(express.static(__dirname + '/images'))

app.use(cors())

//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.urlencoded({extended: false}))

//parse application/json
app.use(bodyParser.json())
app.use(fileUpload())
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
let users = []
let admins = []
const visitors = []
const images = []
let user
let admin
let lugares = []
let idUsuario
let lugaresV = []
//passport initialization login logic
const initializePassport = require('./passport-config')
//email and id are needed for passport to validate the user credentials typed from view login.ejs
initializePassport(passport,
    //email and id are set from our const users
    email => users.find(user => user.usuario_login === email),
    id => users.find(user => user.id_usuario === id)
)

//Get info from db
function getuserdb(req, res, next) {
    sql.connect(config).then(pool => {
        return pool.request().query('SELECT * FROM Usuario')
    })
}

//method used for pushing users from db into array declared above
async function getUsuarios() {
    await sql.connect(config).then(pool => {
        return pool.request()
            .query(queries.getUsuario)
    }).then(result => {
        let output = result.recordset
        users = []
        for (let i = 0; i < output.length; i++) {
            user = output[i]
            users.push(user)
        }
    })
    //console.log(users)
}

async function getAdministradores() {
    await sql.connect(config).then(pool => {
        return pool.request()
            .query(queries.getAdministrador)
    }).then(result => {
        let output = result.recordset
        admins = []
        for (let i = 0; i < output.length; i++) {
            admin = output[i]
            admins.push(admin)
        }
    })
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

function getLugares() {
    sql.connect(config).then(pool => {
        return pool.request()
            .query(queries.getLugar)
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            let lug = output[i]
            lugares.push(lug)
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
    req.flash('success', 'Sesión cerrada!')
    res.redirect('/login')
})
//GET logoutAdmin function
app.get('/logoutAdmin', function (req, res) {
    req.logout()
    req.flash('success', 'Sesión cerrada!')
    res.redirect('/Admin')
})

//GET dashboard page
app.get('/dashboard', ensureAuthenticated, async (req, res) => {

    const _videos = []
    const _imagenes = []
    const _centros = []
    const _idUsuarios = []
    const _visitante = []
    const _servicios = []
    const _regiones = []
    const _registros = []
    const _correoUsuario = req.user.usuario_login

    let _idUsuario
    let _idVisitante

    idCentro = req.body.idCentro

    // current timestamp in milliseconds
    const _ts = Date.now();
    const _date_ob = new Date(_ts);
    const _date = _date_ob.getDate();
    const _month = _date_ob.getMonth() + 1;
    const _year = _date_ob.getFullYear();

    await sql.connect(config).then(pool => {
        return pool.request()
            .query('SELECT * FROM Video')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _videos.push(output[i])
        }
    }).catch(error => {
        return 'VIDEO error: ' + error
    })

    await sql.connect(config).then(pool => {
        return pool.request()
            .query('SELECT * FROM CentroTuristico')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _centros.push(output[i])
        }
    }).catch(error => {
        return 'CENTRO error: ' + error
    })

    await sql.connect(config).then(pool => {
        return pool.request()
            .query('SELECT * FROM Imagen')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _imagenes.push(output[i])
        }
    }).catch(error => {
        return 'IMAGEN error: ' + error
    })

    await sql.connect(config).then(pool => {
        return pool.request()
            .query('SELECT * FROM Usuario')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _idUsuarios.push(output[i])
        }
    }).catch(error => {
        return 'ID USUARIO error: ' + error
    })

    for (let i = 0; i < _idUsuarios.length; i++) {
        if (_idUsuarios[i]['usuario_login'] === _correoUsuario) {
            _idUsuario = _idUsuarios[i]['id_usuario']
        }
    }

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, _idUsuario)
            .query('SELECT * FROM Visitante WHERE id_usuario = @id_usuario')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _visitante.push(output[i])
        }
    }).catch(error => {
        return 'ID VISITANTE error: ' + error
    })

    await sql.connect(config).then(pool => {
        return pool.request()
            .query('SELECT * FROM Region')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _regiones.push(output[i])
        }
    }).catch(error => {
        return 'REGIONES error: ' + error
    })

    await sql.connect(config).then(pool => {
        return pool.request()
            .query('SELECT CentroServicio.id_centro, Servicio.nombre_servicio\n' +
                'FROM Servicio\n' +
                'INNER JOIN CentroServicio ON Servicio.id_servicio=CentroServicio.id_servicio')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _servicios.push(output[i])
        }
    }).catch(error => {
        return 'SERVICIOS error: ' + error
    })

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('correo', sql.NVarChar, _correoUsuario)
            .query('SELECT * FROM Visitante WHERE correo = @correo')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _visitante.push(output[i])
        }
    }).catch(error => {
        return 'VISITANTE error: ' + error
    })

    for (let i = 0; i < _visitante.length; i++) {
        _idVisitante = _visitante[i]['id_visitante']
    }

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('id_visitante', sql.Int, _idVisitante)
            .query('SELECT Registro.id_registro, CentroTuristico.nombre_centro, Region.nombre_region, Region.provincia\n' +
                'FROM Visitante\n' +
                'INNER JOIN Registro ON Visitante.id_visitante = Registro.id_visitante\n' +
                'INNER JOIN CentroTuristico ON Registro.id_centro = CentroTuristico.id_centro\n' +
                'INNER JOIN Region ON CentroTuristico.id_region = Region.id_region\n' +
                'WHERE Visitante.id_visitante = 53')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _registros.push(output[i])
        }
    }).catch(error => {
        return 'REGISTROS error: ' + error
    })

    res.render('dashboard.ejs', {
        name: req.user.usuario_login,
        videos: _videos,
        centros: _centros,
        imagenes: _imagenes,
        servicios: _servicios,
        regiones: _regiones,
        registros: _registros,
        fecha: _date + '/' + _month + '/' + _year,
        nombre: _visitante[0]['nombre'],
        apellido: _visitante[0]['apellido']
    })
})

//POST /dashboard/centroRegUser
app.post('/centroRegUser', async (req, res) => {

    const _correoUsuario = req.user.usuario_login
    const _idCentro = req.body.id_centro
    const _registro = '1'
    const _visitante = []

    let _idVisitante

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('correo', sql.NVarChar, _correoUsuario)
            .query('SELECT * FROM Visitante WHERE correo = @correo')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _visitante.push(output[i])
        }
    }).catch(error => {
        return 'VISITANTE error: ' + error
    })

    for (let i = 0; i < _visitante.length; i++) {
        _idVisitante = _visitante[i]['id_visitante']
    }

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('id_visitante', sql.Int, _idVisitante)
            .input('id_centro', sql.Int, _idCentro)
            .input('registro', sql.Int, _registro)
            .query('INSERT INTO Registro VALUES (@id_visitante,@id_centro,@registro)')
    }).then(result => {
        console.log("Registro have been created: ", result.rowsAffected)
    }).catch(error => {
        return 'REGISTRO error: ' + error
    })

    res.redirect('/dashboard')
})

app.post('/eraseRegUser', async (req, res) => {

    const _idRegistro = req.body.id_registro

    console.log(_idRegistro)
    await sql.connect(config).then(pool => {
        return pool.request()
            .input('id_registro', sql.Int, _idRegistro)
            .query('DELETE FROM Registro WHERE id_registro = @id_registro')
    }).then(result => {
        console.log("Registro have been deleted: ", result.rowsAffected)
    }).catch(error => {
        return 'REGISTRO error: ' + error
    })

    res.redirect('/dashboard')
})

//POST /dashboard/editUser
app.post('/editUser', async (req, res) => {
    let nombre = req.body.nombre
    let apellido = req.body.apellido
    let correo = req.user.usuario_login

    if (nombre === '' && apellido === '') {
        req.flash('error', 'No debes dejar espacios en blanco')
        res.redirect('/dashboard')
    } else {
        await sql.connect(config).then(pool => {
            return pool.request()
                .input('nombre', sql.NVarChar, nombre)
                .input('apellido', sql.NVarChar, apellido)
                .input('correo', sql.NVarChar, correo)
                .query('UPDATE Visitante SET nombre = @nombre, apellido = @apellido WHERE correo = @correo')
        }).then(result => {
            console.log("User updated: ", result.rowsAffected);

        }).catch(error => {
            return 'DATOS USUARIO error: ' + error
        })

        req.flash('success', 'Datos Actualizados!')
        res.redirect('/dashboard')
    }
})

//POST /dashboard/editPass
app.post('/editPass', async (req, res) => {

    const usuario_login = req.user.usuario_login
    const password_login = req.body.password_login
    const password_login2 = req.body.password_login2

    console.log(usuario_login)
    console.log(password_login)

    if (password_login === '' && password_login2 === '') {
        console.log('NO')
        req.flash('error', 'No debes dejar espacios en blanco')
        res.redirect('/dashboard')
    } else {
        console.log('YES')
        await bcrypt.hash(password_login, saltRounds, function (err, hash) {
            sql.connect(config).then(pool => {
                console.log('SQL CONNECTION DONE')
                return pool.request()
                    .input('password_login', sql.NVarChar, hash)
                    .input('usuario_login', sql.NVarChar, usuario_login)
                    .query('UPDATE Usuario SET password_login = @password_login WHERE usuario_login = @usuario_login')
            }).then(result => {
                console.log(hash)
                console.log('QUERY COMPLETED')
                console.log("Password updated: ", result.rowsAffected);
            }).catch(error => {
                console.log('QUERY ERROR')
                return 'PASS USUARIO error: ' + error
            })
        })

        req.flash('success', 'Datos Actualizados, vuelva a iniciar sesión con la nueva contraseña.')
        res.redirect('/logout')
    }


    /*if (!req.files || Object.keys(req.files).length === 0) {
        req.flash('error', 'Ningún archivo fue cargado!')
        res.redirect('/dashboard')
    }

    let image = req.files.image
    let path = image.name

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('direccion', sql.NVarChar, path)
            .query('INSERT INTO Imagen VALUES (@direccion)')
    }).then(result => {
        console.log("Image path have been created: ", result.rowsAffected);
    }).catch(error => {
        //shit happens
        console.log("Failed to create new path image into db: " + error)
        res.sendStatus(500)
        return
    })

    image.mv('../cr_reborn/images/' + image.name, function (err) {
        if (err)
            return res.status(500).send(err)
        req.flash('success', 'Archivo cargado!')
        res.redirect('/dashboard')
    })*/
})

//GET register page
app.get('/register', forwardAuthenticated, (req, res) => {
    res.render('register.ejs')
})
//GET registerAdmin page
app.get('/registerAdmin', forwardAuthenticated, (req, res) => {
    res.render('registerAdmin.ejs')
})


//GET successReg page
app.get('/successReg', (req, res) => {
    res.render('successReg.ejs')
})


//POST registerAdmin

//Receives and stores a new Usuario from registerAdmin page
app.post('/registerAdmin', async (req, res) => {

    //data from input's form
    let id_usuario = ''

    //when a Usuario is stored from registerAdmin, id_tipoUsuario remains as 1 always!
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
                    //in order to create a Administrador...
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

                        //having the right id from Usuario we need to assign the same id to Administrador record as well
                        //Administrador insertion into db
                        sql.connect(config).then(pool => {
                            return pool.request()
                                .input('id_usuario', sql.Int, parseInt(id_usuario))
                                .input('nombre', sql.NVarChar, nombre)
                                .input('apellido', sql.NVarChar, apellido)
                                .input('correo', sql.NVarChar, usuario_login)
                                .query(queries.addAdministrador)
                        }).then(result => {
                            console.log("Administrador has been created: ", result.rowsAffected);
                            req.flash('success', 'Registro completado!')
                            res.redirect('/dashboardAdminAd')
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

        } catch {
            res.redirect('/register')
        }
        //if the user is registered... a fancy msg shows up
    } else {
        req.flash('error', 'El correo electrónico ya se encuentra registrado!')
        res.redirect('/register')
    }
})


//GET registerLugar page
app.get('/registerLugar', forwardAuthenticated, (req, res) => {
    let set = [];
    let set2 = [];
    let set3 = [];
    sql.connect(config).then(pool => {
        return pool.request()
            .query('SELECT * from TipoCentro')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            set[i] = output[i].nombre_tipo
        }
        sql.connect(config).then(pool => {
            return pool.request()
                .query('SELECT * from Region')
        }).then(result => {
            let output = result.recordset
            for (let i = 0; i < output.length; i++) {
                set2[i] = output[i].provincia
            }
            sql.connect(config).then(pool => {
                return pool.request()
                    .query('SELECT * from Servicio')
            }).then(result => {
                let output = result.recordset
                for (let i = 0; i < output.length; i++) {
                    set3[i] = output[i].nombre_servicio
                }
                res.render('registerLugar.ejs', {tipoCombo: set, ubicacionCombo: set2, servicioCombo: set3})
            })
        })
    })
})

//POST registerLugar
app.post('/registerLugar', async (req, res) => {

    let id_tipo = ''
    let id_region = ''
    let id_servicios = ''
    let id_centro = ''
    let i = 0
    const nombre = req.body.nombre
    const ubicacion = req.body.ubicacion
    const tipo = req.body.tipo
    const horario = req.body.horario
    const telefono = req.body.telefono
    const costoA = req.body.costoA
    const costoN = req.body.costoN
    const costoM = req.body.costoM
    const descripcion = req.body.descripcion1
    const idImagen = req.body.costoM
    const servicios = req.body.servicios
    let servicios2 = ''
    const login = 8

    console.log("DESC ", descripcion)

    let image = req.files.image
    let path = image.name

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('direccion', sql.NVarChar, path)
            .query('INSERT INTO Imagen VALUES (@direccion)')
    }).then(result => {
        console.log("Image path have been created: ", result.rowsAffected);
    }).catch(error => {
        //shit happens
        console.log("Failed to create new path image into db: " + error)
        res.sendStatus(500)
        return
    })

    image.mv('../cr_reborn/images/' + image.name, function (err) {
        if (err)
            return res.status(500).send(err)
    })

    sql.connect(config).then(pool => {
        return pool.request()
            .query("SELECT TOP 1 * FROM Imagen ORDER BY id_imagen DESC")
    }).then(result => {
        id_Imagen = result.recordset[0].id_imagen
        sql.connect(config).then(pool => {
            return pool.request()
                .input('tipo', sql.NVarChar, tipo)
                .query('SELECT * FROM TipoCentro WHERE nombre_tipo = @tipo')
        }).then(result => {

            id_tipo = result.recordset[0].id_tipo
            console.log("GET ID TIPO")
            sql.connect(config).then(pool => {
                return pool.request()
                    .input('ubicacion', sql.NVarChar, ubicacion)
                    .query('SELECT * FROM Region WHERE provincia = @ubicacion')
            }).then(result => {


                id_region = result.recordset[0].id_region
                console.log("GET ID REGION")
                sql.connect(config).then(pool => {
                    return pool.request()
                        .input('id_tipo', sql.Int, id_tipo)
                        .input('id_region', sql.NVarChar, id_region)
                        .input('nombre', sql.NVarChar, nombre)
                        .input('horario', sql.NVarChar, horario)
                        .input('telefono', sql.NVarChar, telefono)
                        .input('costoA', sql.NVarChar, costoA)
                        .input('costoN', sql.NVarChar, costoN)
                        .input('costoM', sql.NVarChar, costoM)
                        .input('login', sql.NVarChar, login)
                        .input('descripcion', sql.NVarChar, descripcion)
                        .input('id_Imagen', sql.Int, parseInt(id_Imagen))
                        .query("INSERT INTO CentroTuristico (id_administrador, id_region, id_tipo, nombre_centro, horario, telefono, costo_entrada_adulto,costo_entrada_aMayor,costo_entrada_nino, id_imagen, descripcion ) VALUES (@login, @id_region, @id_tipo,@nombre, @horario,@telefono,@costoA,@costoM,@costoN, @id_Imagen, @descripcion)")
                }).then(result => {
                    console.log("INSERT CENTRO")
                    sql.connect(config).then(pool => {
                        return pool.request()
                            .query("SELECT TOP 1 * FROM CentroTuristico ORDER BY id_centro DESC")
                    }).then(result => {
                        console.log("GET LAST RECORD CENTRO")
                        id_centro = result.recordset[0].id_centro
                        //   console.log(servicios[i])
                        //console.log(servicios[10].length)
                        for (i = 0; i < servicios.length; i++) {
                            servicios2 += servicios[i] + " , "
                        }
                        sql.connect(config).then(pool => {
                            return pool.request()
                                .input('servicios2', sql.NVarChar, servicios2)
                                .query("INSERT INTO Servicio (nombre_servicio) VALUES (@servicios2)")
                        }).then(result => {
                            sql.connect(config).then(pool => {
                                return pool.request()
                                    .input('servicios2', sql.NVarChar, servicios2)
                                    .query("SELECT TOP 1 * FROM Servicio ORDER BY id_servicio DESC")
                            }).then(result => {
                                id_servicios = result.recordset[0].id_servicio
                                console.log(result.recordset)
                                sql.connect(config).then(pool => {
                                    return pool.request()
                                        .input('id_servicio', sql.Int, parseInt(id_servicios))
                                        .input('id_centro', sql.Int, parseInt(id_centro))
                                        .query("INSERT INTO CentroServicio (id_centro,id_servicio) VALUES (@id_centro,@id_servicio)")
                                })

                            })
                        })


                    })

                })
            })

        })
    })
})


//POST edit
app.post('/editLugar', async (req, res) => {

    let id_centro = 9
    let id_tipo = ''
    let id_region = ''
    let id_servicios = ''
    const nombre = req.body.nombre
    const ubicacion = req.body.ubicacion
    const tipo = req.body.tipo
    const horario = req.body.horario
    const telefono = req.body.telefono
    const costoA = req.body.costoA
    const costoN = req.body.costoN
    const costoM = req.body.costoM
    const servicios = req.body.servicios

    sql.connect(config).then(pool => {
        return pool.request()
            .input('tipo', sql.NVarChar, tipo)
            .query('SELECT * FROM TipoCentro WHERE nombre_tipo = @tipo')
    }).then(result => {
        id_tipo = result.recordset[0].id_tipo
        sql.connect(config).then(pool => {
            return pool.request()
                .input('ubicacion', sql.NVarChar, ubicacion)
                .query('SELECT * FROM Region WHERE provincia = @ubicacion')
        }).then(result => {
            id_region = result.recordset[0].id_region
            console.log(tipo)
            sql.connect(config).then(pool => {
                return pool.request()
                    .input('id_centro', sql.Int, parseInt(id_centro))
                    .input('id_region', sql.Int, parseInt(id_region))
                    .input('id_tipo', sql.Int, parseInt(id_tipo))
                    .input('nombre', sql.NVarChar, nombre)
                    .input('horario', sql.NVarChar, horario)
                    .input('telefono', sql.NVarChar, telefono)
                    .input('costoA', sql.NVarChar, costoA)
                    .input('costoM', sql.NVarChar, costoM)
                    .input('costoN', sql.NVarChar, costoN)
                    .query('UPDATE CentroTuristico SET nombre_centro = @nombre, horario = @horario, telefono = @telefono, costo_entrada_adulto = @costoA, costo_entrada_aMayor = @costoM, costo_entrada_nino = @costoN, id_region = @id_region, id_tipo = @id_tipo WHERE id_centro = @id_centro')

            }).then(result => {
                console.log("ACTUALIZO Centro")


                req.flash('success', 'Successful!')
                // res.redirect('/editLugar')
            })
        })
    })
})

//GET editLugar page
app.get('/editLugar', forwardAuthenticated, (req, res) => {
    let id_centro = 9
    let regionID = ' '
    let tipoID = ' '
    let region = ' '
    let tipo = ' '
    let nombre = ' '
    let horario = ' '
    let telefono = ' '
    let costoN = ' '
    let costoA = ' '
    let costoM = ' '
    let servicio = ' '
    let servicioID = ' '
    let set = [];
    let set2 = [];
    let set3 = [];
    sql.connect(config).then(pool => {
        return pool.request()
            .query('SELECT * from TipoCentro')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            set[i] = output[i].nombre_tipo

        }
        sql.connect(config).then(pool => {
            return pool.request()
                .query('SELECT * from Region')
        }).then(result => {
            let output = result.recordset
            for (let i = 0; i < output.length; i++) {
                set2[i] = output[i].provincia

            }
            sql.connect(config).then(pool => {
                return pool.request()
                    .query('SELECT * from Servicio')
            }).then(result => {
                let output = result.recordset
                for (let i = 0; i < output.length; i++) {
                    set3[i] = output[i].nombre_servicio
                }

            }).then(result => {

                sql.connect(config).then(pool => {
                    return pool.request()
                        .input('id_centro', sql.Int, parseInt(id_centro))
                        .query('SELECT * FROM CentroTuristico WHERE id_centro = @id_centro')
                }).then(result => {
                    nombre = result.recordset[0].nombre_centro
                    horario = result.recordset[0].horario
                    telefono = result.recordset[0].telefono
                    costoA = result.recordset[0].costo_entrada_adulto
                    costoM = result.recordset[0].costo_entrada_aMayor
                    costoN = result.recordset[0].costo_entrada_nino
                    regionID = result.recordset[0].id_region
                    tipoID = result.recordset[0].id_tipo

                    sql.connect(config).then(pool => {
                        return pool.request()
                            .input('id_centro', sql.Int, parseInt(id_centro))
                            .query('SELECT id_servicio FROM CentroServicio WHERE id_centro = @id_centro')
                    }).then(result => {
                        //  servicioID = result.recordset[0].id_servicio
                        sql.connect(config).then(pool => {
                            return pool.request()
                                .input('servicioID', sql.Int, parseInt(servicioID))
                                .query('SELECT nombre_servicio FROM Servicio WHERE id_servicio = @servicioID')
                        }).then(result => {
                            //servicio = result.recordset[0].nombre_servicio
                            sql.connect(config).then(pool => {
                                return pool.request()
                                    .input('tipoID', sql.Int, parseInt(tipoID))
                                    .query('SELECT nombre_tipo FROM TipoCentro WHERE id_tipo = @tipoID')
                            }).then(result => {
                                tipo = result.recordset[0].nombre_tipo
                                sql.connect(config).then(pool => {
                                    return pool.request()
                                        .input('regionID', sql.Int, parseInt(regionID))
                                        .query('SELECT * FROM Region WHERE id_region = @regionID')
                                }).then(result => {
                                    res.render('editLugar.ejs', {
                                        name: nombre,
                                        region: result.recordset[0].nombre_region,
                                        provincia: result.recordset[0].provincia,
                                        tipo: tipo,
                                        horario: horario,
                                        telefono: telefono,
                                        costoA: costoA,
                                        costoN: costoN,
                                        costoM: costoM,
                                        servicio: servicio, tipoCombo: set, ubicacionCombo: set2, servicioCombo: set3
                                    })
                                })

                            })
                        })
                    })
                })
            })
        })
    })
})

//POST eliminar Lugat
app.post('/eliminarLugar', async (req, res) => {

    let id_centro = 5
    let id_tipo = ''
    let id_region = ''
    let id_servicios = ''

    sql.connect(config).then(pool => {
        return pool.request()
            .input('id_centro', sql.Int, parseInt(id_centro))
            .query('SELECT * FROM CentroTuristico WHERE id_centro = @id_centro')
    }).then(result => {
        id_region = result.recordset[0].id_region
        id_tipo = result.recordset[0].id_tipo

        sql.connect(config).then(pool => {
            return pool.request()
                .input('id_centro', sql.Int, parseInt(id_centro))
                .query('SELECT id_servicio FROM CentroServicio WHERE id_centro = @id_centro')
        }).then(result => {
            id_servicios = result.recordset[0].id_servicio
            sql.connect(config).then(pool => {
                return pool.request()
                    .input('id_centro', sql.Int, parseInt(id_centro))
                    .query('DELETE FROM CentroServicio WHERE id_centro = @id_centro')

            }).then(result => {
                sql.connect(config).then(pool => {
                    return pool.request()
                        .input('id_centro', sql.Int, parseInt(id_centro))
                        .query('DELETE FROM CentroTuristico WHERE id_centro = @id_centro')

                }).then(result => {
                    console.log("ELIMINO Centro")


                    req.flash('success', 'Successful!')
                    res.redirect('/editLugar')
                })
            })
        })
    })


})

// GET ELIMINAR ADMIN
app.get('/eliminarAdmin', async (req, res) => {
    idUsuario = req.query.id
    res.redirect('/dashboardAdminAd')
})

//POST ELIMINAR ADMIN
app.post('/eliminarAdmin', async (req, res) => {
    let idUser = req.body.id_usuario

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .query("DELETE FROM Administrador WHERE id_usuario = @id_usuario")
    }).then(result => {
        console.log("Admin have been deleted: ", result.rowsAffected);
        sql.connect(config).then(pool => {
            return pool.request()
                .input('id_usuario', sql.Int, parseInt(idUser))
                .query("DELETE FROM Usuario WHERE id_usuario = @id_usuario\"")
        }).then(result => {
            console.log("User have been deactivated: ", result.rowsAffected);
        })
    })

    req.flash('success', 'Administrator was deleted!')
    res.redirect('/dashboardAdminAd')
})

//GET editAdmin page
app.get('/editarAdmin', forwardAuthenticated, async (req, res) => {

    const _usuarios = []
    const _administradores = []

    idUsuario = req.query.id
    let nombre
    let apellido
    let correo

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUsuario))
            .query('SELECT * FROM Usuario WHERE id_usuario = @id_usuario')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _usuarios.push(output[i])
        }
    }).catch(error => {
        return 'ID USUARIO error: ' + error
    })

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUsuario))
            .query('SELECT * FROM Administrador WHERE id_usuario = @id_usuario')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _administradores.push(output[i])
        }
    }).catch(error => {
        return 'ID USUARIO error: ' + error
    })

    for (let i = 0; i < _administradores.length; i++) {
        nombre = _administradores[i]['nombre']
        apellido = _administradores[i]['apellido']
        correo = _administradores[i]['correo']
    }

    res.render('editarAdmin.ejs', {
        nombre: nombre,
        apellido: apellido,
        correo: correo,
    })
})
//POST edit admin
app.post('/editarAdmin', async (req, res) => {

    const idUser = idUsuario
    const nombre = req.body.nombre
    const apellido = req.body.apellido
    const usuario_login = req.body.usuario_login
    const password_login = req.body.password_login

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .input('nombre', sql.NVarChar, nombre)
            .input('apellido', sql.NVarChar, apellido)
            .input('correo', sql.NVarChar, usuario_login)
            .query('UPDATE Administrador SET nombre = @nombre, apellido = @apellido, correo = @correo WHERE id_usuario = @id_usuario')
    }).then(result => {
        console.log("Administrador has been modified: ", result.rowsAffected)
    }).catch(error => {
        return error
    })

    await bcrypt.hash(password_login, saltRounds, function (err, hash) {
        sql.connect(config).then(pool => {
            return pool.request()
                .input('id_usuario', sql.Int, parseInt(idUser))
                .input('usuario_login', sql.NVarChar, usuario_login)
                .input('password_login', sql.NVarChar, hash)
                .query('UPDATE Usuario SET password_login = @password_login, usuario_login = @usuario_login WHERE id_usuario = @id_usuario')
        }).then(result => {
            console.log("Usuario has been modified: ", result.rowsAffected)
        }).catch(error => {
            return error
        })
    })

    req.flash('success', 'Successful!')
    res.redirect('/dashboardAdminAd')
})

//GET edit User page
//editarUser?id=9
app.get('/editarUser', forwardAuthenticated, async (req, res) => {

    const _usuarios = []
    const _visitantes = []

    idUsuario = req.query.id
    let nombre
    let apellido
    let correo

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUsuario))
            .query('SELECT * FROM Usuario WHERE id_usuario = @id_usuario')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _usuarios.push(output[i])
        }
    }).catch(error => {
        return 'ID USUARIO error: ' + error
    })

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUsuario))
            .query('SELECT * FROM Visitante WHERE id_usuario = @id_usuario')
    }).then(result => {
        let output = result.recordset
        for (let i = 0; i < output.length; i++) {
            _visitantes.push(output[i])
        }
    }).catch(error => {
        return 'ID USUARIO error: ' + error
    })

    for (let i = 0; i < _visitantes.length; i++) {
        nombre = _visitantes[i]['nombre']
        apellido = _visitantes[i]['apellido']
        correo = _visitantes[i]['correo']
        console.log(_visitantes[i]['apellido'])
    }

    res.render('editarUser.ejs', {
        nombre: nombre,
        apellido: apellido,
        correo: correo,
    })
})
// GET eliminar user
app.get('/eliminarUser', async (req, res) => {
    idUsuario = req.query.id
    console.log(idUsuario)
    res.redirect('/dashboardAdminUs')
})

//POST eliminar user
app.post('/eliminarUser', async (req, res) => {
    let idUser = idUsuario
    sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .query("DELETE FROM Visitante WHERE id_usuario = @id_usuario")
        console.log('yeeeeeeee' + id_usuario)
    }).then(result => {
        console.log("Admin have been deleted: ", result.rowsAffected);
        sql.connect(config).then(pool => {
            return pool.request()
                .input('id_usuario', sql.Int, parseInt(idUser))
                .query("DELETE FROM Usuario WHERE id_usuario = @id_usuario")
        }).then(result => {
            console.log("User have been deleted: ", result.rowsAffected);
        })
    })
    req.flash('success', 'El usuario fue eliminado exitosamente!')
    res.redirect('/dashboardAdminUs')
})

//POST edit User
app.post('/editarUser', async (req, res) => {

    const idUser = idUsuario
    const nombre = req.body.nombre
    const apellido = req.body.apellido
    const usuario_login = req.body.usuario_login
    const password_login = req.body.password_login

    await sql.connect(config).then(pool => {
        return pool.request()
            .input('id_usuario', sql.Int, parseInt(idUser))
            .input('nombre', sql.NVarChar, nombre)
            .input('apellido', sql.NVarChar, apellido)
            .input('correo', sql.NVarChar, usuario_login)
            .query(queries.updateVisitante)
    }).then(result => {
        console.log("Visitante have been modified: ", result.rowsAffected)
    }).catch(error => {
        return error
    })

    await bcrypt.hash(password_login, saltRounds, function (err, hash) {
        sql.connect(config).then(pool => {
            return pool.request()
                .input('id_usuario', sql.Int, parseInt(idUser))
                .input('usuario_login', sql.NVarChar, usuario_login)
                .input('password_login', sql.NVarChar, hash)
                .query('UPDATE Usuario SET password_login = @password_login, usuario_login = @usuario_login WHERE id_usuario = @id_usuario')
        }).then(result => {
            console.log("Usuario have been modified: ", result.rowsAffected)
        }).catch(error => {
            return error
        })
    })

    req.flash('success', 'Successful!')
    res.redirect('/dashboardAdminUs')
})

//POST register
//TODO: register validitation from backend to frontend
//Receives and stores a new Usuario from register page
app.post('/register', async (req, res) => {

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
            req.flash('success', 'Registro completado!')
            res.redirect('/login')
        } catch {
            res.redirect('/register')
        }
        //if the user is registered... a fancy msg shows up
    } else {
        req.flash('error', 'El correo electrónico ya se encuentra registrado!')
        res.redirect('/register')
    }
})

//GET admin page
app.get('/admin', forwardAuthenticated, (req, res) => {
    res.render('loginAdmin.ejs')
})

//GET dashboardAdmin page
app.get('/dashboardAdminUs', forwardAuthenticated, async (req, res) => {
    await getUsuarios()
    console.log('length', users.length)
    res.render('dashboardAdminUs.ejs', {users})
})
//GET dashboardAdminAd page
app.get('/dashboardAdminAd', forwardAuthenticated, async (req, res) => {
    await getAdministradores()
    console.log('length', admins.length)
    res.render('dashboardAdminAd.ejs', {admins})
})
//GET dashboardAdminLug page
app.get('/dashboardAdminLug', forwardAuthenticated, async (req, res) => {
    await getLugares()
    console.log("dfgdhgfdsa", lugares)
    res.render('dashboardAdminLug.ejs', {lugares})
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
        req.flash('error', 'Admin no registrado!')
        res.redirect('/admin')
    } else {
        idTipoUsuario = result[0].id_tipoUsuario

        if (idTipoUsuario === 1 && password_login === result[0].password_login) {
            req.flash('success', 'Success!')
            console.log(idTipoUsuario)
            res.redirect('/dashboardAdminUs')
        } else {
            req.flash('error', 'Credenciales erróneas!')
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
