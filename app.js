'use strict';

const express           = require('express');
const path              = require('path');
const favicon           = require('serve-favicon');
const cookieParser      = require('cookie-parser');
const bodyParser        = require('body-parser');
const index             = require('./routes/index');
const users             = require('./routes/users');
const app               = express();
const crypto            = require('crypto');
const passport          = require('passport');
const LocalStrategy     = require('passport-local').Strategy;
const connection        = require('./lib/dbconn');
const sess              = require('express-session');
const Store             = require('express-session').Store;
const validator         = require('express-validator');
const BetterMemoryStore = require('session-memory-store')(sess);
const session           = require('client-sessions');
const serverjs          = require('./public/javascript/server');
const server            = require('http').Server(app);
const multer            = require('multer');
const ejs               = require('ejs');

// File alustukset
const storage = multer.diskStorage({
  destination: './public/uploads/',
  //määritellään filename, null on errorin tilalle, fieldname on myImage + päiväys + sama tiedostomuoto mikä lähetyksessä oli
  filename: (req,file,cb)=>{
    cb(null,file.fieldname + '-' + Date.now()+ path.extname(file.originalname));
  }
});

//Uploadauksen kytkentä. Single sen takia koska yksi tiedosto. Ottaa sisäänsä formin
const upload = multer({
  storage: storage,
  limits:{fileSize:500000},
  fileFilter: (req,file,cb)=>{
      //tarkistetaan filetype ja mime varmistaakseen että tiedosto on oikeanlainen
      const filetypes = /jpeg|jpg|png|gif/;
      //tiedoston loppu
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      //Mime tsek
      const mimetype = filetypes.test(file.mimetype);
      if(extname && mimetype){
        return cb(null,true);
      }else{
        cb('error: Väärä tiedostotyyppi');
      }
    }

}).single('myImage');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//initialisoidaan validator
app.use(validator());
//middleware
app.use(cookieParser());
//public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', index);
app.use('/users', users);

//Express session store and expiration
// TÄmän voi ottaa pois jos käytetään keksejä?
const store = new BetterMemoryStore({ expires: 60 * 60 * 1000, debug: true });

serverjs(server);

//sets expiration time for session in store variable. Then session name and session secret is set.
app.use(sess({
  name: 'OMASESSION',
  secret: 'AAPELIONYLIARVOSTETTU',
  store:  store,
  // tallentaisi aina uudestaan muutoksista huolimatta
  resave: false,
  //tallentaisi session siitä huolimatta että ei ole initialisoitu
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(session({
  cookieName: 'session',
  secret: 'miksi_mikaan_ei_toimi_koskaan_surunaama',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

//======================================================================================================================
//===================================================== HÖPÖ FUNKTIOT ==================================================
//======================================================================================================================

/* GET home page.*/ 
app.get('/', (req, res, next)=> {
  res.render('index', {
    session: req.session.user
  });
});

app.get('/signin', (req, res)=>{
  res.render('signin');
})

//Päiväyksen rakentaminen
const formatDate = () =>{
  const today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  const yyyy = today.getFullYear();

  if(dd < 10){
    dd = '0' + dd;
  }
  if(mm < 10){
    mm = '0' + mm;
  }
  return yyyy+'-'+mm+'-'+dd;
};

//Tarkistetaan onko keksit, jossei niin palautetaan etusivulle
const requireLogin =  (req, res, next)=> {
  if (!req.session.user) {
    res.redirect('/');
  } else {
    next();
  }
};

app.get('/tictactoe',requireLogin, (req, res, next)=>{
  res.render('tictactoe', {
    session: req.session.user
  });
});

// hashaa passwordin
const passwordHash=(password)=>{
    const salt = '7fa73b47df808d36c5fe328546ddef8b9011b2c6' + password;
    return  crypto.createHash('sha1').update(salt).digest('hex');
};

//keeping db conn alive
setInterval(function () {
  connection.query('SELECT 1');
}, 15000);

// select sql haku yhdellä hakuehdolla
const dbSelect=(where,valueWhat, value)=>{
    let string = `SELECT * FROM ${where} `;
    if(valueWhat){
        string =+ `WHERE ${valueWhat} = ?`;
    }
    connection.query(string,[value],(err, rows)=> {
        if (!rows.length) {
            return rows;
        } else {
            return false;
        }
    });
};


//======================================================================================================================
//===================================================== SALASANAN TARKISTUS ============================================
//======================================================================================================================

passport.use('local', new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true //passback entire req to call back
    } , (req, username, password, done)=>{
      if(!username || !password ) { return done(null, false); }
      connection.query("select * from user where Username = ?", [username], (err, rows)=>{
        if (err) return done();
        if(!rows.length){ 
          return done(null, false);
        }
        const encPassword = passwordHash(password);
        const dbPassword  = rows[0].Password;
        if(!(dbPassword == encPassword)){
          return done(null, false);
        }
        req.session.user= rows[0];
        return done(null, rows[0]);
      });
    }
));

// Passport serializes user information to store in session, deserialize function is used to deserialize the data.
passport.serializeUser((user, done)=>{
  done(null, user.PlayerID);
});

passport.deserializeUser((id, done)=>{
  connection.query("select * from user where PlayerID = "+ id,  (err, rows)=>{
    done(err, rows[0]);
  });
});

//======================================================================================================================
//===================================================== PROFIILI =======================================================
//======================================================================================================================

//henk. koht profiili. Näyttää kirjautujan henk koht. tiedot(jos toimii)
app.get('/profile',requireLogin, (req,res)=> {
    connection.query("SELECT  ProfilePic FROM custom WHERE  PlayerID=?",
        [req.session.user.PlayerID], (err, rows) => {
        res.render('profile', {
          'session': req.session.user,
          file: `uploads/${rows[0].ProfilePic}`,
          message: "Welcome back!"
        });
      });
});

//======================================================================================================================
//===================================================== Käyttäjälista ================================================
//======================================================================================================================

app.get('/userlist',requireLogin,(req,res)=>{
  connection.query(
      `SELECT 
            U.Username,
            U.Level,
            U.Created,
            COUNT(H.GameID) AS Games,
			      C.ProfilePic,
			      U.PlayerID
        FROM
            history as H,
			      user as U,
			      custom as C

        WHERE
			      (H.Player1ID = U.PlayerID
        OR
            H.Player2ID = U.PlayerID)
        AND
			      C.PlayerID = U.PlayerID
        GROUP BY U.Username`
      ,(err, rows)=>{
        if (rows.length) {
          res.render('userlist', {
            session: req.session.user,
            message: "List of users",
            users: rows
          })
        }else{
          res.render('userlist', {
            session: req.session.user,
            message: "No users lol"
          })
        }
      });
});


//======================================================================================================================
//===================================================== Peli historia ================================================
//======================================================================================================================

app.get('/history',requireLogin,(req,res)=>{
    connection.query(
        `SELECT
             U.Username AS Player1,
             Y.Username AS Player2,
             G.Gamename,
             H.GameDate,
             H.Winner
        FROM
            history AS H,
            user AS U,
            game AS G,
            user AS Y
        WHERE
            H.Player1ID = U.PlayerID
        AND
            H.Player2ID = Y.PlayerID
        AND 
			      (H.Player1ID = ?
        OR
        	  H.Player2ID = ?)
		    AND
            H.GameID = G.GameID`,
        [req.session.user.PlayerID , req.session.user.PlayerID],(err, rows)=>{
        if (rows.length) {
            res.render('history', {
                session: req.session.user,
                message: "History",
                history: rows
            })
        }else{
            res.render('history', {
                session: req.session.user,
                message: "No history"
        })
    }
});});

//======================================================================================================================
//===================================================== UUSI SALASANA ==================================================
//======================================================================================================================

app.post('/newpassword',requireLogin,(req,res) =>{
  req.check('oldpassword','Password on huono: Pituus vähintään 5, käytä vain aakkosia ja numeroita'
  ).isLength({min:5, max:25}).isAlphanumeric('sv-SE');
  req.check('newpassword','Password on huono: Pituus vähintään 5, käytä vain aakkosia ja numeroita'
  ).isLength({min:5, max:25}).isAlphanumeric('sv-SE');

  const valErrors= req.validationErrors();

  // jos annetut arvot eivät ole hyviä annetaan palautteena mikä vialla
  if(valErrors){
    res.send(valErrors);
    //Jos salasanat hyviä siirrytään eteenpäin
  }else {
    //Haetaan sql kekseissä olevan usernamen username ja salasana
    // const rows = dbSelect("user","Username",req.session.user.Username);
    connection.query("Select Username, Password FROM user WHERE Username = ?",[req.session.user.Username],(err,rows)=>{
      //Jos jostain syystä ei löydy sen nimistä käyttäjää annetaan error
      if (rows.length) {
        //saltataan vanha salasana että voidaan verrata sitä db olevaan
        const encPassword = passwordHash(req.body.oldpassword);

        const dbPassword  = rows[0].Password;
        //verrataan onko vanha salasana sama kuin mikä palvelimelta löytyy
        if(dbPassword == encPassword){
          // Jos on sama, aloitetaan uuden salasanan siirto palvelimelle. ensiksi salataan salasana
          const encPassword = passwordHash(req.body.newpassword);

          //Tehdään SQL update, samalla päivitetään Modified tällä päivällä
          const sql = 'UPDATE user SET Password=?, Modified=?   WHERE Username=?';
          connection.query(sql, [encPassword, formatDate(), req.session.user.Username], (err, result) => {
            //Lopuksi pitää päivittää kekseihin uudet tiedot
            res.locals.user = rows[0];
            // Suunnataan takaisin profiilisivulle
            res.send("Password changes succesfully!");
          })
        }else{
          res.send("Could not change password. Wrong password.");
        }}})}});

//======================================================================================================================
//===================================================== YSTÄVÄT ========================================================
//======================================================================================================================

app.post('/isfriend',requireLogin,(req,res)=>{
  if(!isNaN(req.body.id1) && !isNaN(req.body.id2)){
    connection.query("SELECT Friend1ID, Friend2ID FROM friend_of WHERE" +
        " (Friend1ID=? AND Friend2ID=?)OR(Friend1ID=? AND Friend2ID=?)",[req.body.id1,req.body.id2,req.body.id2,req.body.id1], (err,rows)=>{
      if(!rows){
        res.send(false);
      }else{
          if(rows[0] == null){
              res.send(false);
          }else{
              res.send(true);
          }
      }
    });
  }else{
    res.send(false);
  }
});

app.post('/makefriend',requireLogin,(req,res)=>{
  if(!isNaN(req.body.id1) && !isNaN(req.body.id2)) {
      connection.query(`INSERT INTO friend_of(Friend1ID,Friend2ID) VALUES(?,?)`,
          [req.body.id1, req.body.id2], (err, rows) => {
              if (!err) {
                  res.send(true);
              } else {
                  res.send(false);
              }
          });
  }
});

app.post('/removefriend',requireLogin,(req,res)=>{
  if(!isNaN(req.body.id1) && !isNaN(req.body.id2)){
        connection.query(`DELETE FROM friend_of WHERE (Friend1ID=? AND Friend2ID=?)OR(Friend1ID=? AND Friend2ID=?)`,
            [req.body.id1,req.body.id2,req.body.id2,req.body.id1],(err,rows)=>{
          if(!err){
            res.send(true);
          }else{
            res.send(false);
          }
        });
      }
});

//======================================================================================================================
//===================================================== KUVA UPLOAD ====================================================
//======================================================================================================================
//Uploadaus ajaxil meni vähä oudoks nii antaa vaa olla...
app.post('/upload',requireLogin,(req,res) =>{
  console.log("uylpodasduas jee");

  console.log(req + " "+ res);
  //kutsutaan upload methodia
  upload(req,res,(err)=>{
    if(err){
      res.render('profile',{
        message: err,
        session: req.session.user,
      });

    }else{
      if(req.file == undefined){
        res.render('profile', {
          message: 'Error: Ei filettä',
          session: req.session.user,
        })
      }else{
        //TODO poista vanha profiilikuva?
        connection.query("UPDATE custom SET ProfilePic=? WHERE PlayerID=?",[req.file.filename, req.session.user.PlayerID],(err,rows)=>{
          connection.query("SELECT  ProfilePic FROM custom WHERE  PlayerID=?",[req.session.user.PlayerID],(err, rows)=>{

            res.render('profile',{
              //TODO SIISTI TÄÄ KAMAN LÄHETYS
              message: "Image changed succesfully!",
              file: `uploads/${rows[0].ProfilePic}`,
              //file: `uploads/${req.file.filename}`,
              session: req.session.user,
            });
          });
        });
      }}});
});

//======================================================================================================================
//=====================================================KIRJAUTUMINEN====================================================
//======================================================================================================================

app.post("/login", passport.authenticate('local', {

  successRedirect: '/profile',

  failureRedirect: '/signin',

  //failureFlash: true

}), (req, res, info)=>{
//Empty callback this is handled by middleware
});

//uloskirjautuminen TODO KORJAA POISTA KEKSIT
app.get('/logout', (req, res)=> {
  delete req.session.user;
  req.session.authenticated = false;
  res.clearCookie;
  //req.session.user = null;
  //req.logout();
  res.redirect('/');
});


//======================================================================================================================
//===================================================REKISTERÖITYMINEN==================================================
//======================================================================================================================

app.post("/register", (req, res, info)=>{

  //Katsotaan että annetut arvot ovat ok palvelimen puolella myös
  req.check('email','Email on huono').isEmail();
  req.check('password','Password on huono: Pituus vähintään 5, käytä vain aakkosia ja numeroita'
  ).isLength({min:5, max:25}).isAlphanumeric('sv-SE');
  req.check('username','Username on huono: Pituus vähintään 5, käytä vain aakkosia ja numeroita'
  ).isLength({min:5, max:25}).isAlphanumeric('sv-SE');
  //laitetaan kaikki mahdolliset errorit valErrors constiin
  const valErrors= req.validationErrors();
  console.log("rekisteröinti 1");

  //jos valErrorissa on jotain niin ohjataan takaisin etusivulle errortiedon kanssa
  if(valErrors){
    console.log("rekisteröinti 2");
    res.render('signin',{
      error: valErrors

  })}else {
    console.log("rekisteröinti 3");
  //asioiden helpottamiseksi tehdään lowercaseks sähköposti ja username
    const username = req.body.username.toLowerCase();
    const password = req.body.password;
    const email = req.body.email.toLowerCase();
    // katsotaan onko käyttäjänimi / tai sähköposti käytössä
      connection.query('SELECT Username, Email FROM user WHERE Username= ? OR Email = ?',[username,email],(err, result, fields) => {
        //jos tulee joku kämmi haussa niin saadaan tietää
        console.log("rekisteröinti 4");
            if(!result.length){
            //Käyttäjänimi uniikki joten tehdään uusi käyttäjä
              const encPassword = passwordHash(password);
              console.log(encPassword);
              const sql = 'INSERT INTO user (Username,Password,Email,Created,Modified) VALUES(?,?,?,?,?)';
              connection.query(sql, [username, encPassword, email,formatDate(), formatDate()], (err, result) => {
                console.log("rekisteröinti 6");
                connection.query('SELECT * FROM user WHERE Username=?',[username],(err,rows)=>{

                    req.session.user= rows[0];

                    const sql = 'INSERT INTO custom (PlayerID, ProfilePic) VALUES(?,?)';
                    connection.query(sql, [rows[0].PlayerID,"default.jpg"], (err, result) => {
                      console.log("rekisteröinti 7");
                        res.render('profile', {
                            session: req.session,
                            message: "Welcome!",
                            username:username,
                            email:  email,
                            date: formatDate(),
                        })
                    });
                });
              });

              //käyttäjänimi jo käytössä, heitetään takas etusivulle errorMessagen kanssa
            } else {
              const errorMes = "Käyttäjä nimi mm. jo käytössä";
              console.log("rekisteröinti 8");
              res.render('signin', {
                message: errorMes
              })}
          });}
});
//module.exports.pullCookies = pullCookies;
module.exports = app;
//app.post();
