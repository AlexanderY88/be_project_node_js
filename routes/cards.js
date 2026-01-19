const express = require("express");
const router = express.Router();
const joi = require("joi");
const User = require("../models/User");
const Card = require("../models/Card");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const auth = require("../middlewares/auth");

// create new card
// joi validation schema for card creation
const checkCardBody = joi.object({
    title: joi.string().min(2).max(256).required(),
    subtitle: joi.string().min(0).max(256).allow('').required(),
    description: joi.string().min(0).max(1024).allow('').optional(),
    phone: joi.string().required().min(9).max(11),
    email: joi.string().email().required().min(5),
    web: joi.string().uri().optional().min(14),
    image: joi.object({
        url: joi.string().uri(),
        alt: joi.string().min(0).max(256)
    }).required(),
    address: joi.object({
        state: joi.string().min(0).max(256).allow('').optional(),
        country: joi.string().min(2).max(256).required(),
        city: joi.string().min(2).max(256).required(),
        street: joi.string().min(2).max(256).required(),
        houseNumber: joi.string().pattern(/^\d{1,256}$/).required(),
        zip: joi.string().pattern(/^\d{1,256}$/).required()
    }).required(),
    bizNumber: joi.number().required(),
    user_id: joi.string().required()
});
  
router.post("/", auth, async (req,res) => {
    try {
        // 1. validate request body
        const {error} = checkCardBody.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });
        // 2. check if authenticated user exists and is business user
        const user = await User.findById(req.user._id); // Changed from req.user.id to req.user._id
        if (!user) return res.status(404).json({ message: "User not found" });
        // 3. check if user is biz
        if (!user.isBusiness) return res.status(403).json({ message: "Only business users can create cards" });
        // 4. check if bizNumber is unique
        const existingCard = await Card.findOne({ bizNumber: req.body.bizNumber });
        if (existingCard) return res.status(400).json({ message: "Business number already exists" });
        // 5. create new card with authenticated user's ID
        const cardData = { ...req.body, user_id: req.user._id }; 
        const newCard = new Card(cardData);
        await newCard.save();
        res.status(201).json(newCard);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// get all cards
router.get("/", async (req,res) => {
    try {
        // 1. check if any cards at DB 
        const cards = await Card.find();
        if (cards.length === 0) return res.status(404).send("No cards found");
        
        // 2. Transform cards to include likes count and current user like status
        const transformedCards = cards.map(card => {
            const cardObj = card.toObject();
            const likesCount = card.likes.length;
            
            // Check if there's an authenticated user and if they liked this card
            const isLikedByCurrentUser = req.user ? card.likes.includes(req.user._id) : false;
            
            // Remove the likes array and add computed fields
            const { likes, ...cardWithoutLikes } = cardObj;
            
            return {
                ...cardWithoutLikes, // returns all cards fields except 'likes'
                likesCount, // return number of likes for the card to show in client
                isLikedByCurrentUser // return indication if the user liked the card
            };
        });
        
        res.status(200).json(transformedCards);
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

// get all my cards
router.get("/my-cards", auth, async (req,res) => {
    try {
        const cards = await Card.find({user_id: req.user._id.toString()});
        if (cards.length === 0) return res.status(404).send("You have no cards");
        res.status(200).json(cards);
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

// get card by id
router.get("/:id", async (req,res) => {
    try {
        // 1. check if the card exist
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).send(`No card with id ${req.params.id} found`); 
        // 2. return the card
        res.status(200).send(card);
    } catch (error) {
        res.status(500).send("Internal server error")
    }
});

// update card by id
router.put("/:id", auth, async (req,res) => {
    try {
        // 1. validate request body
        const {error} = checkCardBody.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);
        // 2. Check if card exists
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).send(`No card with id ${req.params.id} found`);
        // 3. check if the user is card owner or admin
        const cardOwner = card.user_id.toString() === req.user._id;
        const isAdmin = req.user.isAdmin; // Use JWT token data instead of database lookup
        // if the user is not owner and not admin - 403 error
        if (!cardOwner && !isAdmin) {
            return res.status(403).send("Access denied: You can only update your own cards or must be admin");
        }
        // 4. Update the card and return updated card
        const updatedCard = await Card.findByIdAndUpdate(req.params.id, req.body, {new: true});
        res.status(200).send(updatedCard);
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

// delete card by id
router.delete("/:id", auth, async (req,res) => {
    try {
        // 1. check if the card exists 
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).send(`No card with id ${req.params.id} found`);
        // 2. check if the user is card owner or admin
        const cardOwner = card.user_id.toString() === req.user._id;
        const isAdmin = req.user.isAdmin; // Use JWT token data instead of database lookup
        if (!cardOwner && !isAdmin) {
            return res.status(403).send("Access denied: You can only delete your own cards or must be admin");
        } 
        // 3. delete the card
        await Card.findByIdAndDelete(req.params.id);
        res.status(200).send(`Card with id ${req.params.id} deleted successfully`);
    } catch (error) {
        return res.status(500).send("Internal server error");
    }
});

// like / unlike the card by id 
router.patch("/like/:id", auth, async (req,res) => {
    try {
        const userId = req.user._id;
        // Check if card exists and if user already liked it
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).send(`No card with id ${req.params.id} found`);
        const isLiked = card.likes.includes(userId);
        // add the user id to likes array if not liked yet or remove it if user unlike the card
        const updatedCard = await Card.findByIdAndUpdate(
            req.params.id,
            isLiked 
                ? { $pull: { likes: userId } }      // Remove from array
                : { $addToSet: { likes: userId } }, // Add to array (no duplicates)
            { new: true }
        );
        res.status(200).json(updatedCard);
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

// patch cards business number by id 
router.patch("/bizNumber/:id", auth, async (req,res) => {
    try {
        const newBizNumber = req.body.bizNumber;
        // 1. Check if card exists
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).send(`No card with id ${req.params.id} found`);
        // 2. check if the user is card owner or admin
        const cardOwner = card.user_id.toString() === req.user._id;
        const isAdmin = req.user.isAdmin;
        // if the user is not owner and not admin - 403 error
        if (!cardOwner && !isAdmin) {
            return res.status(403).send("Access denied: You can only update your own cards or must be admin");
        }
        // 3. check if the new bizNumber already exists in OTHER cards
        const existingCard = await Card.findOne({ 
            bizNumber: newBizNumber, 
            _id: { $ne: req.params.id } // Exclude current card from check
        });
        if (existingCard) return res.status(400).send("Business number already exists");
        // 4. update the card bizNumber
        const updatedCard = await Card.findByIdAndUpdate(
            req.params.id,
            { bizNumber: newBizNumber },
            { new: true }
        );
        res.status(200).json(updatedCard);
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});




module.exports = router;