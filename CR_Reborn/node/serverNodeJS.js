const http = require("http");
const server = http.createServer(function (peticion, respuesta){
    respuesta.end("Servidor Test creado con NodeJS");
});

server.listen(3000, function (){
    console.log("Server listo para ser utilizado en " + this.address().port);
});