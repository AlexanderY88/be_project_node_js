const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({

   title: {
        type: String,
        required: true,
    },
    subtitle: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    web: {
        type: String,
    },
    image: {
        url: {
            type: String
        },
        alt: {
            type: String
        }
    },
    address: {
        state: {
            type: String
        },
        country: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        street: {
            type: String,
            required: true
        },
        houseNumber: {
            type: Number,
            required: true
        },
        zip: {
            type: Number,
            required: true
        }
    },
    bizNumber: {
        type: Number,
        required: true,
        unique: true
    },
    user_id: {
        type: String,
        required: true
    },
    likes: {
        type: [String], // Array of user IDs who liked this card
        default: []
    }

});


const Card = mongoose.model("cards", cardSchema);
module.exports = Card;
