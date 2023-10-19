const express = require('express');
const app = express();
const dateInfo= require("./dateTime_et");
const fs = require('fs')
const dbConfig = require('/vp23config');
const database = 'if23_eliana_leonova';
const mysql = require('mysql2');
const bodyparser = require('body-parser');
//lisame failisüsteemi moodul 


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false }));


//loon andmebaasiühenduse
const conn = mysql.createConnection({
    host: dbConfig.configData.host,
    user: dbConfig.configData.user,
    password: dbConfig.configData.password,
    database: dateBase
});


//route
app.get('/', (req, res)=> {
    //res.ssend('See töötab!');
    res.render('index');
}); 

app.get('/timenow', (req, res)=>{
    const dateNow = dateInfo.dateNowET(); 
    const timeNow = dateInfo.timeNowET(); 
    res.render('timenow',{h1: "Praegune hetk", dateN: dateNow, timeN: timeNow});
});

app.get('/wisdom', (req, res)=> {
    let folkWisdom = [ ];
    fs.readFile("./txtfiles/vanasõnad.txt", "utf8", (err, data)=> {
        if(err) {
            console.log(err);
        }
        else {
            folkWisdom = data.split(";");
            res.render('justlist',{h1: 'Vanasõnad', wisdom: folkWisdom});
        }
    });

}); 

app.get('/eestifilm', (req, res)=> {
    //res.ssend('See töötab!');
    res.render('eestifilmindex');
}); 

app.get('/eestifilm/filmiloend', (req, res)=> {
    //res.ssend('See töötab!');
    let sql = 'SELECT title, production_year FROM movie';
    let sqlresult = [];
    conn.query(sql, (err, result) => {
        if (err) {
            throw err;
            res.render('eestifilmlist',  {filmlist: sqlresult});
        }
        else { 
            //console.log(result);
            //console.log(result[4].title);
            sqlresult = result;
            //console.log(sqlresult);
            res.render('eestifilmlist', {filmlist: sqlresult});
        }
    });
   // res.render('eestifilmlist',  {filmlist: sqlresult});
}); 

app.get('/eestifilm/lisaperson', (req, res)=> {
    //res.ssend('See töötab!');
    res.render('eestifilmaddperson');
}); 

app.post ('/eestifilm/lisaperson', (req, res)=> {
    console.log(req.body);
    let notice = '';
    let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES (?,?,?)'; 
    conn.query(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result=> {
        if(err) {
            throw err;
            notice = 'Andmete salvestamine ebaõnnestus!' + err;
            res.render('eestifilmaddperson', {notice: notice});
        }
        else {
            notice = 'Filmitegelase' + req.body.firstNameInput + '' + req.body.lastNameInput + 'salvestamine õnnestus!';
            res.render('eestifilmaddperson', {notice: notice});

        }
    }));
}); 

app.listen(5213);

