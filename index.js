const express = require('express');
const app = express();
const dateInfo= require("./dateTime_et");
const fs = require('fs')
//lisame failisüsteemi moodul 


app.set('view engine', 'ejs');
app.use(express.static('public'));

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




app.listen(5200);

