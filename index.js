const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

/////////////////////////////////////

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
const mySecret = process.env['MONGO_URI'];
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true, autoIndex: true });
const Schema = mongoose.Schema;


const UserSchema = Schema({
  username: { type: String, required: true }
});
const UserModel = mongoose.model("UserModel", UserSchema);


const LogSchema = new Schema({
  user_id: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String }
})
const LogModel = mongoose.model("LogModel", LogSchema);


app.post("/api/users", (req, res) => {
  const userName = req.body.username;
  let newUser = UserModel({ username: userName });
  newUser.save((err, newUserData) => {
    if (err) console.log(err);
    res.json({ "username": userName, "_id": newUserData._id });
  })
})

app.get("/api/users", (req, res) => {
  UserModel.find((err, users) => {
    if (err) console.log(err);
    res.send(users);
  });
})

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  let { description, duration, date } = req.body;
  if (date !== undefined && date.trim() !== '') date = new Date(date).toDateString();
  else date = new Date().toDateString();

  UserModel.findById(userId, (err, foundUser) => {
    if (err) console.log(err);
    if (foundUser) {
      let newLog = LogModel({ user_id: userId, description: description, duration: duration, date: date })
      newLog.save((errTwo, newLogSaved) => {
        let userName = foundUser.username;
        if (errTwo) console.log(errTwo);
        res.send({ "_id": userId, "username": userName, "date": date, "duration": Number(duration), "description": description });
      })
    }
  })
})

app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;
  let fromDate;
  let toDate;
  if (from) {
    fromDate = new Date(from).getTime();
    toDate = new Date(to).getTime();
  }
  UserModel.findById(userId, (err, userFound) => {
    if (err) console.log(err);
    let userName = userFound.username;
    LogModel.find({ user_id: userId }, (errTwo, logArr) => {
      if (errTwo) console.log(errTwo);
      let newLogArr = logArr.
        map(logItem => {
          return { description: logItem.description, duration: logItem.duration, date: logItem.date }
        })
      if (fromDate) newLogArr.filter(logItem => new Date(logItem.date).getTime() > fromDate).filter(logItem => new Date(logItem.date).getTime() < toDate);
      newLogArr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (limit && limit < newLogArr.length) newLogArr.length = limit;
      res.send({ "_id": userId, "username": userName, "count": logArr.length, "log": newLogArr });
    })
  })

})
