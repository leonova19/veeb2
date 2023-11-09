const express = require('express');
const app = express();
const dateInfo= require("./dateTime_et");
const fs = require('fs')
const dbConfig = require('../../vp23config/vp23config');
const database = 'if23_eliana';
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
    database: database
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
    res.render('eestifilmindex');
}); 

app.get('/eestifilm/filmiloend', (req, res)=> {
    //res.ssend('See töötab!');
    let sql = 'SELECT title, production_year FROM movie';
    let sqlresult = [];
    conn.query(sql, (err, result) => {
        if (err) {
            throw err;
            res.render('eestifilmilist',  {filmlist: sqlresult});
        }
        else { 
            //console.log(result);
            //console.log(result[4].title);
            sqlresult = result;
            //console.log(sqlresult);
            res.render('eestifilmilist', {filmlist: sqlresult});
        }
    });
   // res.render('eestifilmlist',  {filmlist: sqlresult});
}); 

app.get('/news', (reg,res)=>{
    res.render('news');
});

app.get('/news/add', (reg,res)=>{
    res.render('addnews');
});

app.get('/news/read', (reg,res)=>{
    res.render('readnews');
});

app.get('/news/read/:id', (reg,res)=>{
    //res.render('readnews');
    console.log(req.params);
    console.log(req.query);
    res.send('Vaatame uudis, mille id on: ' + req.params.id)
});


app.get('/eestifilm/lisaperson', (req, res)=> {
    //res.ssend('See töötab!');
    res.render('eestifilmaddperson', {notice:''});
}); 

app.get('/eestifilm/tegelased', (req, res)=> {
    let sql = 'select first_name, last_name, birth_date from person';
    let sqlresult = [];
    conn.query(sql, (err, result) => {
        if (err) {
            throw err;
        }
        else { 
            //console.log(result);
            //console.log(result[4].title);
            sqlresult = result;
            //console.log(sqlresult);
            res.render('tegelased', {tegelased:result});
        }
    });
}); 




app.post ('/eestifilm/lisaperson', (req, res)=> {l
    let notice = '';
    let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES (?,?,?)'; 
    conn.query(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result) => {
        if(err) {
            console.log('err', err)
            notice = 'Andmete salvestamine ebaõnnestus!' + err;
            res.render('eestifilmaddperson', {notice: notice});
        }
        else {
            notice = 'Filmitegelase' + req.body.firstNameInput + '' + req.body.lastNameInput + 'salvestamine õnnestus!';
            res.render('eestifilmaddperson', {notice: notice});

        }
    });
}); 

app.listen(5213);

