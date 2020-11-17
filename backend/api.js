//objects vars
const dboperations = require('./dboperations');

//dependencies vars
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var router = express.Router();

//bodyParser
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use(cors());
app.use('/api', router);

//middleware
router.use((request, response, next) => {
   console.log('middleware');
   next();
});

//GET operations
router.route('/tipousuario').get((request, response) => {
    dboperations.getTipoUsuario().then(result => {
        response.json(result[0]);
    });
});

router.route('/tipousuario/:id').get((request, response) => {
    dboperations.getTipoUsuarioID(request.params.id).then(result => {
        response.json(result[0]);
    });
});

router.route('/usuario').get((request, response) => {
    dboperations.getUsuario().then(result => {
        response.json(result[0]);
    });
});

router.route('/administrador').get((request, response) => {
    dboperations.getAdministrador().then(result => {
        response.json(result[0]);
    });
});

router.route('/visitante').get((request, response) => {
    dboperations.getVisitante().then(result => {
        response.json(result[0]);
    });
});

router.route('/tipocentro').get((request, response) => {
    dboperations.getTipoCentro().then(result => {
        response.json(result[0]);
    });
});

router.route('/servicio').get((request, response) => {
    dboperations.getServicio().then(result => {
        response.json(result[0]);
    });
});

router.route('/centroservicio').get((request, response) => {
    dboperations.getCentroServicio().then(result => {
        response.json(result[0]);
    });
});

router.route('/region').get((request, response) => {
    dboperations.getRegion().then(result => {
        response.json(result[0]);
    });
});

router.route('/centroturistico').get((request, response) => {
    dboperations.getCentroTuristico().then(result => {
        response.json(result[0]);
    });
});

router.route('/registro').get((request, response) => {
    dboperations.getRegistro().then(result => {
        response.json(result[0]);
    });
});

//POST operations
router.route('/usuario').post((request, response) => {
    let usuario = {...request.body}

    dboperations.addUsuario(usuario).then(result => {
        response.status(201).json(result);
    });
});

//port config
var port = process.env.PORT || 8090;
app.listen(port);
console.log('Usuario API is running at ' + port);


