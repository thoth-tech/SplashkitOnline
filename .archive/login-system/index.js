
const base = `${__dirname}/public`;
const express = require('express')
const session = require("express-session");
const passport = require('passport')
require('./auth')
const path = require('path');

const app = express();
app.use(express.static('public'));
function isLoggedIn(req, res, next){
    req.user ? next() : res.sendStatus(401)

}

app.use(session({ secret: 'cats'}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
     
    res.sendFile(`${base}/index.html`);
    

});

// Sherap's work
app.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile']})
)

app.get('/google/callback',
   passport.authenticate('google',{
    successRedirect: '/protected',
    failureRedirect: '/auth/failure',
   })
);

app.get('/auth/failure',(req,res) =>{
    res.send('something went wrong ..');
})
app.get('/protected', isLoggedIn, (req,res) =>{
    res.send('You are logged in successfully');
})
app.listen(5000, () => console.log('listening on 5000'));
// Sherap's work