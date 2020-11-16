const express = require('express');
const app = express();

app.get('/', function (req, res) {

   const sql = require("mssql");

   // config for your database
   const config = {
      user: 'cr_reborn',
      password: 'reborn123',
      server: 'localhost',
      database: 'dbCRReborn'
   };

   // connect to your database
   sql.connect(config, function (err) {

      if (err) console.log(err);

      // create Request object
      let request = new sql.Request();

      // query to the database and get the records
      request.query('select * from TipoCentro', function (err, recordset) {

         if (err) console.log(err)

         // send records as a response
         res.send(recordset);

      });
   });
});

const server = app.listen(5000, function () {
   console.log('Server is running..');
});