const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const User = require("../models/user.model");

const bcrytpSalt = 15;

const uploadCloud = require("../config/cloudinary.js");

router.use((req, res, next) => {
  if (req.session.currentUser) {
    next();
    return;
  }
  // si no hay ning'un usuario le redige al Home
  res.redirect("/");
});

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.get("/profile", (req, res, next) => {
  res.render("profile/user-profile");
});


router.get("/edit-profile", (req, res, next) => {
  res.render("profile/edit-profile");
}); 

router.post("/edit-profile", 
  uploadCloud.single("profilePicture"),
  async (req, res, next) => {
  try {
    const user = req.session.currentUser;

    const { _id } = user;

    let profileUpdate = {}

    Object.entries(req.body).map( valueInput => {
      let key = valueInput[0]; // campo
      let value = valueInput[1]; // valor del campo
      if(key === 'password' && value !== ''){

        if (value.length < 8) {
          res.render('profile/edit-profile', { errorMessage: "Password must contain at least 8 characters." });
          return;
        }

        const salt = bcrypt.genSaltSync(bcrytpSalt);
        const hashedPassword = bcrypt.hashSync(value, salt);
        profileUpdate[key]=hashedPassword;
        return;
      }

      if (value !== "") {
        profileUpdate[key]=value;
        return;
      }
      
      return;
    });

    if(profileUpdate.email){

      const isUser = await User.findOne({ email: profileUpdate.email });
      
      if(isUser){
        errorMessage = 'This user already exists';
        res.render('profile/edit-profile', { errorMessage })
        return;
      }
    }

    if(typeof req.file !== 'undefined'){
      profileUpdate['profilePicture'] = req.file.url;
    }

    await User.updateOne(
      { _id },
      { $set: { ...profileUpdate } },
      { new: true}
    );

    req.session.currentUser = await User.findById({ _id });
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
    res.redirect("/profile");
    return;
  }
});

module.exports = router;
