const express = require("express");
const router = express.Router();
const joi = require("joi");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const auth = require("../middlewares/auth");


// registration route
// create joi validation schema for registration body
const checkRegisterBody = joi.object({
    name: joi.object({
        first: joi.string().min(2).max(256).required(),
        middle: joi.string().min(0).max(256).allow('').optional(),
        last: joi.string().min(2).max(256).required()
    }).required(),
    phone: joi.string().required().min(9).max(11),
    email: joi.string().email().required().min(5),
    password: joi.string().required().min(6).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.!_@#$%^&*-])[A-Za-z\d.!_@#$%^&*-]{6,}$/),
    image: joi.object({
        url: joi.string().uri().allow('').optional(),
        alt: joi.string().min(0).max(256).allow('').optional()
    }).optional(),
    address: joi.object({
        state: joi.string().min(0).max(256).allow('').optional(),
        country: joi.string().min(2).max(256).required(),
        city: joi.string().min(2).max(256).required(),
        street: joi.string().min(2).max(256).required(),
        houseNumber: joi.string().pattern(/^\d{1,256}$/).required(),
        zip: joi.string().pattern(/^\d{1,256}$/).required()
    }).required(),
    isBusiness: joi.boolean().required().default(false),
    isAdmin: joi.boolean().required().default(false)
});

router.post("/register", async (req,res) => {
    try {
        // 1. joi validation
        const {error} = checkRegisterBody.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);
        // 2. check if user exist by email
        let user = await User.findOne({email : req.body.email});
        if (user) return res.status(400).send("User already registered.");
        // 3. create new user password 
        user = new User(req.body);
        // 4. encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();
        // 5. create token
        const token = jwt.sign({isAdmin: user.isAdmin, _id: user._id}, process.env.JWTKEY);
        res.status(201).send(token);
    } catch (error) {
        console.error("Register error:", error); // Debug log
        res.status(500).send("Server error");
    }
});


// login route
const checkLoginBody = joi.object({
    email: joi.string().email().required().min(5),
    password: joi.string().required().min(6).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.!_@#$%^&*-])[A-Za-z\d.!_@#$%^&*-]{6,}$/)
});

router.post("/login", async (req,res) => {
    try {
        // 1. joi validation
        const {error} = checkLoginBody.validate(req.body);
        if(error) return res.status(400).send(error.details[0].message);
        // 2. check if user exist by email
        let user = await User.findOne({email: req.body.email});
        if(!user) return res.status(400).send("Invalid email or password.");
        // 3. check password
        const result = await bcrypt.compare(req.body.password, user.password);
        if (!result) return res.status(400).send("Wrong email or password");
        // 4. create token
        const token = jwt.sign({isAdmin: user.isAdmin, _id: user._id}, process.env.JWTKEY);
        res.status(200).send(token);
    } catch (error) {
        res.status(500).send("Server error");
}
});

// get current user details route
router.get("/", auth, async (req,res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).send("User not found");
        res.status(200).json(_.omit(user.toObject(), ['password', '__v', '_id']));
    } catch (err) {
        res.status(500).send("Internal server error");
    }
});

// update user route
// I will use joi validation of register user process, to not duplicate the code
router.put("/update", auth, async (req,res) => {
    try {
        // 1. joi validation
        const {error} = checkRegisterBody.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);
        // 2. check if user exist by id
        let user = await User.findOne({_id: req.user._id});
        if (!user) return res.status(404).send("User not found");
        // 3. update user details
        await User.updateOne({_id: req.user._id}, req.body);
        res.status(200).json(_.omit(user.toObject(), ['password', '__v', '_id']));
    } catch (err) {
        res.status(500).send("Internal server error")
    }
});

// get all users route
router.get("/all", auth, async (req,res) => {
    try {
        const users = await User.find();
        if (users.length == 0) return res.status(404).send("No users found");
        const usersWithoutSensitiveInfo = users.map(user => _.omit(user.toObject(), ['password', '__v']));
        res.status(200).json(usersWithoutSensitiveInfo);
    } catch (error) {
        res.status(500).send("Internal server error")
    }
});

// get current user details
router.get("/currentUser", auth, async (req,res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).send("User not found");
        res.status(200).json(_.omit(user.toObject(), ['password', '__v']));
    } catch (err) {
        res.status(500).send("Internal server error")
    }
});

// delete user route
router.delete("/:id", auth, async (req,res) => {
    try {
        // 1. check if user exist by id
        let user = await User.findOne({_id: req.params.id});
        if (!user) return res.status(404).send("User not found");
        // 2. delete user
        await User.findByIdAndDelete(req.params.id);
        res.status(200).send("User deleted successfully");
    } catch (err) {
        res.status(500).send("Internal server error")
    }
});

// get users details by id - for crm usage route
router.get("/profile/:id", auth, async (req,res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send("User not found");
        res.status(200).json(_.omit(user.toObject(), ['password', '__v']));
    } catch (err) {
        res.status(500).send("Internal server error")
    }
});

// patch business status of user by id
router.patch("/business/:id", auth, async (req,res) => {
    try { 
        // 1. check if user exist by id
        let user = await User.findOne({_id: req.params.id});
        if (!user) return res.status(404).send("User not found");
        // 2. update isBusiness status
        user.isBusiness = !user.isBusiness;
        await user.save();
        res.status(200).json(_.omit(user.toObject(), ['password', '__v']));
    } catch (err) {
        res.status(500).send("Internal server error")
    }
});


module.exports = router;