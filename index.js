const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
require("dotenv").config();

const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


//.........setting up session
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
  }));
  
  //....initalise passport
  app.use(passport.initialize());
  
  //....use passport
  app.use(passport.session());
  
  
  mongoose.set('strictQuery', false);
  mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "MongoDB connection error:"));
  db.once("open", () => {
  console.log("Connected to MongoDB");


  const userSchema = new mongoose.Schema({
    name:String,
    email: String,
    password: String,
    
  });
  
  
  //add plugin before creating model
  userSchema.plugin(passportLocalMongoose);
  
  
  const User = new mongoose.model("User", userSchema);
  
  
  passport.use(User.createStrategy());
  
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());


  const SubscriptionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    start_date: Date,
    end_date: Date,
    status: String,
  });
  
  const PaymentSchema = new mongoose.Schema({
    subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    amount: Number,
    payment_date: Date,
    payment_status: String,
  });
  
  const PlanSchema = new mongoose.Schema({
    name: String,
    monthly_price: Number,
    yearly_price: Number,
    video_quality: String,
    resolution: String,
    devices: [String],
    active_screens: Number,
  });
  
  const Subscription = mongoose.model('Subscription', SubscriptionSchema);
  const Payment = mongoose.model('Payment', PaymentSchema);
  const Plan = mongoose.model('Plan', PlanSchema);
  
 
const initialPlans = [
  {
    name: 'Basic',
    monthly_price: 100,
    yearly_price: 1000,
    video_quality: 'Good',
    resolution: '480p',
    devices: ['Phone'],
    active_screens: 1,
  },
  {
    name: 'Standard',
    monthly_price: 200,
    yearly_price: 2000,
    video_quality: 'Good',
    resolution: '720p',
    devices: ['Phone','Tablet'],
    active_screens: 3,
  },
  {
    name: 'Premium',
    monthly_price: 500,
    yearly_price: 5000,
    video_quality: 'Better',
    resolution: '1080p',
    devices: ['Phone','Tablet','Computer'],
    active_screens: 5,
  },
  {
    name: 'Regular',
    monthly_price: 700,
    yearly_price: 7000,
    video_quality: 'Best',
    resolution: '4K+HDR',
    devices: ['Phone','Tablet','TV'],
    active_screens: 10,
  },
];

Plan.find()
  .then(existingPlans => {
    if (existingPlans.length === 0) {
      return Plan.insertMany(initialPlans);
    }
    return existingPlans; // Plans already exist, no need to insert
  })
  .then(plans => {
    if (plans.length > 0) {
      console.log('Plans inserted');
    } else {
      console.log('No plans inserted. Plans already exist.');
    }
  })
  .catch(error => {
    console.error('Error inserting plans:', error);
  });




app.get("/",(req,res)=>{
  res.render("index");
})



  
  app.get("/signin", (req, res) => {
    res.render("signin",{ 
        authenticated: req.isAuthenticated()
     });
  });




app.post("/", (req, res) => {
  User.register(
    { username: req.body.username ,
      name:req.body.name}, 
      req.body.password, (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/plans");
        });
      }
    }
  );
});


app.post("/signin", (req, res) => {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  })

  req.login(user, (err)=> {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/plans");
      })
    }
  })
});


app.get('/plans', (req, res) => {
  const toggle = req.query.toggle || 'monthly'; // Default to monthly
  Plan.find()
    .then(plans => {
      res.render('plans', { plans, toggle });
    })
    .catch(error => {
      console.error('Error fetching plans:', error);
    });
});


app.get("/payment",(req,res)=>{
  res.render()
})








app.listen(3000, function () {
    console.log("Server started on port 3000");
  });
});