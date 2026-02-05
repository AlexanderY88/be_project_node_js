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
        const token = jwt.sign({isAdmin: user.isAdmin, _id: user._id, isBusiness: user.isBusiness}, process.env.JWTKEY);
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
        const token = jwt.sign({isAdmin: user.isAdmin, _id: user._id, isBusiness: user.isBusiness}, process.env.JWTKEY);
        res.status(200).send(token);
    } catch (error) {
        res.status(500).send("Server error");
}
});

// get current user details route, the id send from JWT token via body of request
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
router.put("/update/:id", auth, async (req,res) => {
    try {
        const targetUserId = req.params.id;
        
        // 1. Authorization check: the user can update his own profile OR admin can update any profile
        const isOwnProfile = targetUserId === req.user._id.toString();
        const isAdmin = req.user.isAdmin;
        // 2. checks if the current user updating his own profile or admin - because at client side of the project admin able to update any user, so I added functionality also to the server side
        if (!isOwnProfile && !isAdmin) {
            return res.status(403).send("Access denied: You can only update your own profile or must be admin");
        }
        // 2. joi validation
        const {error} = checkRegisterBody.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);
        // 3. check if target user exists
        let targetUser = await User.findById(targetUserId);
        if (!targetUser) return res.status(404).send("User not found");
        // 4. update user details
        await User.updateOne({_id: targetUserId}, req.body);
        // 5. get updated user and return it
        const updatedUser = await User.findById(targetUserId);
        res.status(200).json(_.omit(updatedUser.toObject(), ['password', '__v', '_id'])); // not returns users password, version of update and id - for security reasons
    } catch (err) {
        res.status(500).send("Internal server error")
    }
});

// get all users route
router.get("/all", auth, async (req,res) => {
    try {
        // 1. check if admin from  JWT token
        if (!req.user.isAdmin) return res.status(403).send("Access denied: only for admins permissions");
        // 2. returns all users without passwords
        const users = await User.find();
        if (users.length == 0) return res.status(404).send("No users found");
        const usersWithoutSensitiveInfo = users.map(user => _.omit(user.toObject(), ['password', '__v']));
        res.status(200).json(usersWithoutSensitiveInfo);
    } catch (error) {
        res.status(500).send("Internal server error")
    }
});


// delete user route
router.delete("/:id", auth, async (req,res) => {
    try {
        const targetUserId = req.params.id;
        
        // 1. Authorization check: only admin can delete users OR user can delete their own account
        const isOwnProfile = targetUserId === req.user._id.toString();
        const isAdmin = req.user.isAdmin;
        
        if (!isOwnProfile && !isAdmin) {
            return res.status(403).send("Access denied: You can only delete your own account or must be admin");
        }
        
        // 2. check if user exists by id
        let user = await User.findOne({_id: targetUserId});
        if (!user) return res.status(404).send("User not found");
        
        // 3. delete user
        await User.findByIdAndDelete(targetUserId);
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
        const targetUserId = req.params.id;
        
        // 1. Authorization check: only admin can change business status OR user can change their own business status
        const isOwnProfile = targetUserId === req.user._id.toString();
        const isAdmin = req.user.isAdmin;
        
        if (!isOwnProfile && !isAdmin) {
            return res.status(403).send("Access denied: You can only change your own business status or must be admin");
        }
        
        // 2. check if user exists by id
        let user = await User.findOne({_id: targetUserId});
        if (!user) return res.status(404).send("User not found");
        
        // 3. update isBusiness status
        user.isBusiness = !user.isBusiness;
        await user.save();
        res.status(200).json(_.omit(user.toObject(), ['password', '__v']));
    } catch (err) {
        res.status(500).send("Internal server error")
    }
});


module.exports = router;