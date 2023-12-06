const express = require('express');
const app = express();
const fs = require('fs');
const mysql = require('mysql2');
const bodyparser = require('body-parser');
const dateInfo = require('./dateTime_et');
const dbConfig = require('../../vp23config/vp23config');
const dBase = 'if23_inga_pe_DM';
const dataBase = 'if23_eliana';
const multer = require('multer');
//seame multer jaoks vahevara, mis määrab üleslaadimise kataloogi
const upload = multer({ dest: './public/gallery/orig/' });
const mime = require('mime');
const sharp = require('sharp');
const async = require('async');

//krypteerimiseks
const bcrypt = require('bcrypt');
//sessiooni jaoks
const session = require('express-session');
app.use(session({ secret: 'minuAbsoluutseltSalajaneVõti', saveUninitialized: true, resave: false }));

let mySession;

app.set('view engine', 'ejs');
app.use(express.static('public'));
//app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.urlencoded({ extended: true }));

//loon andmebaasiühenduse
const conn = mysql.createConnection({
    host: dbConfig.configData.host,
    user: dbConfig.configData.user,
    password: dbConfig.configData.password,
    database: dataBase
});


app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', (req, res) => {
    let notice = 'Ootel!';
    console.log(req.body);
    // javascript AND ->   &&    OR ->   ||
    if (!req.body.firstNameInput || !req.body.lastNameInput || !req.body.genderInput || !req.body.birthInput || !req.body.emailInput || !req.body.passwordInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput) {
        console.log('andmeid puudu või sobimatud!');
        notice = 'Andmeid puudu või sobimatud!';
        res.render('signup', { notice: notice });
    }
    else {
        console.log('OK!');
        notice = 'Ok!';
        //"soolame" ja krüpteerime parooli
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(req.body.passwordInput, salt, (err, pwdHash) => {
                let sql = 'INSERT INTO vp_users (firstname, lastname, birthdate, gender, email, password) VALUES(?,?,?,?,?,?)';
                conn.execute(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthInput, req.body.genderInput, req.body.emailInput, pwdHash], (err, result) => {
                    if (err) {
                        console.log('err', err)
                        notice = 'Andmete salvestamine ebaõnnestus!';
                        res.render('signup', { notice: notice });
                    }
                    else {
                        notice = 'Kasutaja ' + req.body.emailInput + ' lisamine õnnestus!';
                        res.render('signup', { notice: notice });
                    }
                });
            });
        });
    }
});

app.post('/', (req, res) => {
    let notice = '';
    if (!req.body.emailInput || !req.body.passwordInput) {
        console.log('Paha!');
    }
    else {
        console.log('Hea!')
        let sql = 'SELECT password FROM vp_users WHERE email = ?';
        conn.execute(sql, [req.body.emailInput], (err, result) => {
            if (err) {
                notice = 'Tehnilise vea tõttu sisse logida ei saa!';
                console.log('ei saa andmebaasisit loetud');
                res.render('index', { notice: notice });
            }
            else {
                console.log(result);
                if (result.length == 0) {
                    console.log('Tühi!');
                    notice = 'Viga kasutajatunnuses või paroolis!';
                }
                else {
                    //võrdleme parooli andmebaasist saaduga
                    bcrypt.compare(req.body.passwordInput, result[0].password, (err, compresult) => {
                        if (err) {
                            throw err;
                        }
                        else {
                            if (compresult) {
                                console.log('Sisse!');
                                notice = 'Saad sisse logitud!';
                                mySession = req.session;
                                mySession.userName = req.body.emailInput;
                            }
                            else {
                                console.log('Jääd välja!');
                                notice = 'Ei saa sisse logitud!';
                            }
                        }
                    });
                }
                res.render('index', { notice: notice });
            }
        });
    }
});


app.get('/logout', (req, res) => {
    console.log(mySession.userName);
    console.log('Välja!');
    req.session.destroy();
    mySession = null;
    res.redirect('/');
});



app.get('/eestifilm/lisaseos', (req, res) => {
    //res.send('See töötab!');
    //paneme async mooduli abil mitu asja korraga tööle
    //1) loome tegevuste loendi
    const myQueries = [
        function (callback) {
            conn.execute('SELECT id,title from movie', (err, result) => {
                if (err) {
                    return callback(err);
                }
                else {
                    return callback(null, result);
                }
            });
        },
        function (callback) {
            conn.execute('SELECT id,first_name, last_name from person', (err, result) => {
                if (err) {
                    return callback(err);
                }
                else {
                    return callback(null, result);
                }
            });
        }
    ];
    //paneme need tegevused asünkroonselt paralleelselt tööle
    async.parallel(myQueries, (err, results) => {
        if (err) {
            throw err;
        }
        else {
            console.log(results);
            //mis kõik teha, ka render osa vajalike tükkidega
        }
    });


    res.render('eestifilmaddrelation');
});


//route
app.get('/', (req, res) => {
    //res.ssend('See töötab!');
    res.render('index');
});

app.get('/photoupload', checkLogin, (req, res) => {
    res.render('photoupload');
});

app.post('/photoupload', upload.single('photoInput'), (req, res) => {
    let notice = '';
    console.log(req.file);
    console.log(req.body);
    //const mimeType = mime.getType(req.file.path);
    //console.log(mimeType);

    const fileName = 'vp_' + Date.now() + '.jpg';
    //fs.rename(req.file.path, './public/gallery/orig/' + req.file.originalname, (err)=> {
    fs.rename(req.file.path, './public/gallery/orig/' + fileName, (err) => {
        console.log('Viga: ' + err);
    });

    const mimeType = mime.getType('./public/gallery/orig/' + fileName);
    console.log('Tüüp: ' + mimeType);
    //loon pildist pisipildi (thumbnail)
    sharp('./public/gallery/orig/' + fileName).resize(800, 600).jpeg({ quality: 90 }).toFile('./public/gallery/normal/' + fileName);
    sharp('./public/gallery/orig/' + fileName).resize(100, 100).jpeg({ quality: 90 }).toFile('./public/gallery/thumbs/' + fileName);
    console.log('SIIIN')
    let sql = 'INSERT INTO vp_gallery (filename, originalname, alttext, privacy, userid) VALUES (?,?,?,?,?)';
    const userid = 1;

    conn.execute(sql, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userid], (err, result) => {
        if (err) {
            console.log('err', err)
            throw err;
            notice = 'Foto andmete salvestamine ebaõnnestus!' + err;
            res.render('photoupload', { notice: notice });
        }
        else {
            notice = 'Pilt "' + req.file.originalname + '" laeti üles!';
            res.render('photoupload', { notice: notice });
        }
    });
})



app.get('/photogallery', (req, res) => {
    let photoList = [];
    let sql = 'SELECT id,filename,alttext FROM vp_gallery WHERE privacy > 1 AND deleted IS NULL ORDER BY id DESC';
    conn.execute(sql, (err, result) => {
        if (err) {
            throw err;
        }
        else {
            photoList = result;
            console.log('gallery', result);
            res.render('photogallery', { photoList: photoList });
        }
    });
});


app.get('/timenow', (req, res) => {
    const dateNow = dateInfo.dateNowET();
    const timeNow = dateInfo.timeNowET();
    res.render('timenow', { h1: "Praegune hetk", dateN: dateNow, timeN: timeNow });
});

app.get('/wisdom', (req, res) => {
    let folkWisdom = [];
    fs.readFile("./txtfiles/vanasõnad.txt", "utf8", (err, data) => {
        if (err) {
            console.log(err);
        }
        else {
            folkWisdom = data.split(";");
            res.render('justlist', { h1: 'Vanasõnad', wisdom: folkWisdom });
        }
    });

});

app.get('/eestifilm', (req, res) => {
    res.render('eestifilmindex');
});

app.get('/eestifilm/filmiloend', (req, res) => {
    let sql = 'SELECT id, title, production_year FROM movie ORDER BY production_year DESC';
    conn.query(sql, (err, result) => {
        if (err) {
            throw err;
        }
        else {
            res.render('eestifilmilist', { filmlist: result });
        }
    });
    // res.render('eestifilmlist',  {filmlist: sqlresult});
});


app.get('/eestifilm/filmiloend/:id', (req, res) => {
    const filmiloendId = req.params.id
    const sql = `SELECT * FROM movie WHERE id = "${filmiloendId}"`
    conn.query(sql, (err, result) => {
        if (err) {
            throw err;
        }
        else {
            const filmiloend = result[0]
            res.render('film', { filmiloend: filmiloend });
        }
    });
});

app.get('/news', (reg, res) => {
    res.render('news');
});

app.get('/news/add', (reg, res) => {
    res.render('addnews');
});

app.get('/news/read', (reg, res) => {
    let sql = `SELECT * FROM vp_news WHERE expire > "${new Date().toISOString()}" AND DELETED IS NULL ORDER BY id DESC`;
    console.log('sql', sql)
    conn.query(sql, (err, result) => {
        if (err) {
            throw err;
        }
        else {
            res.render('readnews', { news: result });
        }
    });
});

app.get('/news/read/:id', (req, res) => {
    const uudisId = req.params.id
    const sql = `SELECT * FROM vp_news WHERE id = "${uudisId}"`
    conn.query(sql, (err, result) => {
        if (err) {
            throw err;
        }
        else {
            const uudis = result[0]
            res.render('uudis', { uudis: { ...uudis, added: dateInfo.dateNowET(uudis.added) } });
        }
    });
});



app.get('/eestifilm/lisaperson', (req, res) => {
    //res.ssend('See töötab!');
    res.render('eestifilmaddperson', { notice: '' });
});


app.get('/eestifilm/lisaperson', (req, res) => {
    //res.ssend('See töötab!');
    res.render('eestifilmaddrelation', { notice: '' });
});


app.get('/eestifilm/tegelased', (req, res) => {
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
            res.render('tegelased', { tegelased: result });
        }
    });
});




app.post('/eestifilm/lisaperson', (req, res) => {
    let notice = '';
    let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES (?,?,?)';
    conn.query(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result) => {
        if (err) {
            console.log('err', err)
            notice = 'Andmete salvestamine ebaõnnestus!' + err;
            res.render('eestifilmaddperson', { notice: notice });
        }
        else {
            notice = 'Filmitegelase' + req.body.firstNameInput + '' + req.body.lastNameInput + 'salvestamine õnnestus!';
            res.render('eestifilmaddperson', { notice: notice });

        }
    });
});

app.post('/news/add', (req, res) => {
    let sql = 'INSERT INTO vp_news (title, content, expire, userid) VALUES (?,?,?,?)';
    conn.query(sql, [req.body.titleInput, req.body.contentInput, req.body.expirehDateInput, 1], (err, result) => {
        if (err) {
            console.error('EBAÕNNESTUS UUDISE SALVESTAMINE:', err)
            res.render('addnews');
        }
        else {
            res.redirect('/news/read');
        }
    });
});

//paneme need tegevused 


//funktsioon mis kontrollib sisselogimist . on vahevara (middleware)
function checkLogin(req, res, next) {
    console.log('Kontrollime, kas on sisselogitud!');
    if (mySession != null) {
        if (mySession.userName) {
            console.log('Ongi sees!');
            next()
        }
        else {
            console.log('Polnud sisse loginud!');
            res.redirect('/');
        }
    }
    else {
        console.log('Polnud sisse loginud!');
        res.redirect('/');
    }
    next();
}


app.listen(5213);
