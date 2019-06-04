const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://sammy:ebusam12@ds159036.mlab.com:59036/fccdb', { useMongoClient: true })

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


const SchemaUser = new mongoose.Schema({
  username: String,
  description: '',
  duration: Number,
  userId: '',
  date: {type: Date, default: Date.now}
});

const Users = mongoose.model('Users', SchemaUser);

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/exercise/new-user', (req, res) => {
  if(req.body.username.length > 20) return res.json('username too long!');
  Users.findOne({username: req.body.username}, (err, data) => {
    if(err) return err;
    if(data){
      res.send('username already taken');
    }else{
      let user = new Users({username: req.body.username});
        user.userId = user._id.toString().slice(0, 11)
        user.save((err, data) => {
          if (err) return err;
          res.json({username: data.username, id: data.userId})
        })
    }
  })
})


app.post('/api/exercise/add', (req, res) => {
  Users.findOne({userId: req.body.userId}, (err, data) => {
    if(err) return res.json({message: 'Invalid User'});
      new Users({
        username: data.username, description: req.body.description,
        duration: req.body.duration, date: req.body.date, userId: req.body.userId
      })
        .save((err, result) => {
          if (err) return console.error(err);
          let date = result.date + '';
          res.json({
            username: result.username, description: result.description,
            duration: result.duration, _id: result.userId, date: date.replace(/ \d+:\d+:\d.+/,'')
          })
        })
  })
})


app.get('/api/exercise/users', (req, res) => {
  Users.find().exec((err, data) => {
    res.json(data)
  })
})
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
