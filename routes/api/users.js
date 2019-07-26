const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const keys = require("../../config/keys");
const passport = require("passport");

const User = require("../../models/User");

//引入验证方法
const valitadeRegisterInput = require("../../validation/registor");
const valitadeLoginInput = require("../../validation/login");

router.get("/test", (req, res) => {
  res.json({ msg: "login works" })
})

//$route POST api/users/register
//@desc 返回的请求的JSON数据
//access public
router.post("/register", (req, res) => {
  //引入验证方法
  const { errors, isValid } = valitadeRegisterInput(req.body)
  //判断isValid是否通过
  if (!isValid) {
    return res.status(400).json(errors);
  }

  //console.log(req.body);
  //查询数据库中是否有邮箱
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (user) {
        return res.status(400).json({ email: "邮箱已被注册！！！" })
      } else {

        const avatar = gravatar.url(req.body.email, { s: '200', r: 'pg', d: 'mm' });

        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avatar,
          password: req.body.password
        })

        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(newUser.password, salt, function (err, hash) {
            if (err) throw err;

            newUser.password = hash;

            newUser.save()
              .then(user => res.json(user))
              .catch(err => console.log(err));
          });
        });
      }
    })
})

//$route POST api/users/login
//@desc 返回token jwt password
//access public
router.post("/login", (req, res) => {

//引入验证方法
const { errors, isValid } = valitadeLoginInput(req.body)
//判断isValid是否通过
if (!isValid) {
  return res.status(400).json(errors);
}

  const email = req.body.email;
  const password = req.body.password;
  //查询数据库
  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(404).json({ email: '用户不存在！！' });
      }

      //密码匹配
      bcrypt.compare(password, user.password)
        .then(isMath => {
          if (isMath) {
            const rule = { id: user.id, name: user.name };
            jwt.sign(rule, keys.secretOrKey, { expiresIn: 3600 },
              (err, token) => {
                if (err) throw err;
                res.json({
                  success: true,
                  token: "Bearer " + token
                });
              })
            //  res.json({msg:"success"});
          } else {
            return res.status(400).json({ password: '密码错误！！' });
          }
        })


    })

})

//$route GET api/users/current
//@desc return current user
//access Private
router.get("/current", passport.authenticate("jwt", { session: false }), (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name
  }
  );
})

module.exports = router;
