const express = require("express");
// const open = require('open'); // Import the 'open' package
const path = require("path");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config("./.env"); // Make sure you've loaded dotenv here

function validateToken(req, res, next) {
  const token = req.query.token;
  jwt.verify(token, process.env.TOKEN_KEY, function (err, authData) {
    if (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = authData.user;
    next();
  });
}

const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");

const app = express();
app.set("view engine", "ejs");

const url = "mongodb://localhost:27017/";

app.use(express.static(path.join(__dirname, "html module")));
app.use(express.static(path.join(__dirname, "land")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/mainPage", (req, res) => {
  res.sendFile(path.join(__dirname, "land", "index.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "html module", "login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "html module", "signup.html"));
});

const authMiddleware = async function (req, res, next) {
  console.log("in authmiddleware");
  console.log("body : ", req.body);
  console.log("query : ", req.query);
  console.log("params : ", req.params);
  let flag = 1;
  try {
    const client = new MongoClient(url);
    await client.connect();
    console.log("Mongo connection done");

    const db = client.db("online_examination_system");
    const collection = db.collection("user_pass");
    const result = await collection
      .find({
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
      })
      .toArray(); // Convert the cursor to an array
    console.log("checked login details");

    if (result.length == 0) {
      flag = 0;
      res.redirect("details are wrong");
    } else {
      // Create token
      const token = jwt.sign({ user: result[0] }, process.env.TOKEN_KEY, {
        expiresIn: "2h",
      });
      // save user token
      result[0].token = token;
      res.status(201).json(result[0]);
    }
  } catch (error) {
    console.error("Mongo error:", error);
  }

  if (flag) next(); // Call next() after the database operations are complete
};

app.post("/authuser", authMiddleware, (req, res) => {
  console.log("Successfully verified");
});

app.get("/home", validateToken, (req, res) => {
  if (req.user.role == "instructor") {
    res.render("instructor.ejs", { user: req.user });
  } else if (req.user.role == "admin") {
    res.render("home.ejs", { email: req.user.email });
  } else {
    res.render("studentuserpage.ejs", { user: req.user });
  }
});

let personData;
let st = "";

app.post("/send_otp", (req, res) => {
  console.log("yes i am otp section");
  console.log(req.body);
  personData = req.body;
  const generatePassword = function () {
    // Remove the 'await' here and make it a regular function
    let digits = "0123456789";
    st = "";
    for (let i = 0; i < 6; i++) st += digits[Math.floor(Math.random() * 10)];
  };
  generatePassword(); // Call the function to generate the OTP
  console.log(st);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "akn778811@gmail.com",
      pass: "lfrt klxz hlus skje",
    },
  });

  const mail = req.body.email;
  console.log("mail :", mail);

  let options = {
    from: "akn778811@gmail.com",
    to: mail,
    subject: "Email verification for Online Examination Platform",
    text: `Your OTP verification code is ${st}`,
  };

  transporter.sendMail(options, (error, info) => {
    // Correct the method name to 'sendMail'
    if (error) {
      console.log("Send mail error", error);
    } else {
      console.log("Email sent", info.response);
    }
  });

  res.sendFile(path.join(__dirname, "html module", "otpinput.html"));
});

app.post("/verify_otp", (req, res) => {
  console.log(req.body);
  const otp = req.body.otp;
  if (otp == st) {
    const client = new MongoClient(url);
    client
      .connect()
      .then(() => {
        console.log("mongo connection done");

        const db = client.db("online_examination_system");

        const collection = db.collection("user_pass");

        collection
          .insertOne(personData)
          .then((result) => {
            console.log("Successfully registered");
          })
          .catch((error) => console.log("Mongo error:", error))
          .finally(() => {
            client.close();
            console.log("Mongo connection closed");
          });
      })
      .catch((error) => console.log("Mongo connection error:", error));
    res.redirect("/login");
  } else res.redirect("/signup");
});

//instructor
const router = require("./instructor");
app.use("/", router);

//user student
const router2 = require("./userstudent");
app.use("/", router2);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("app is listening");
});

module.exports = app;
