# Business Cards API - Node.js Express Server

A RESTful API for managing business cards and users with authentication, built with Node.js, Express, and MongoDB.

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Git

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AlexanderY88/be_project_node_js.git
   cd be_project_node_js
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install all required packages individually (if needed):**
   ```bash
   npm install express mongoose cors dotenv joi bcryptjs jsonwebtoken lodash chalk morgan fs-extra
   ```

4. **Install development dependencies:**
   ```bash
   npm install --save-dev nodemon
   ```

### Package Overview:
- **express**: Web framework for Node.js
- **mongoose**: MongoDB object modeling tool
- **cors**: Cross-Origin Resource Sharing middleware
- **dotenv**: Environment variable loader
- **joi**: Data validation library
- **bcryptjs**: Password hashing library
- **jsonwebtoken**: JWT token generation and verification
- **lodash**: JavaScript utility library
- **chalk**: Terminal styling library
- **morgan**: HTTP request logger middleware
- **fs-extra**: Enhanced file system methods
- **nodemon**: Development tool for auto-restarting server

### Environment Configuration

1. **Create a `.env` file in the root directory:**
   ```env
   # MongoDB Connection (Cloud first, then local fallback)
   DB=cloud_mongodb_connection_string_here
   LOCAL_DB=local_mongodb_connection_string_here
   
   # Server Configuration
   PORT=8000
   
   # JWT Secret
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

2. **Start the server:**
   ```bash
   # Development with auto-restart
   npm run dev
   
   # Production
   npm start
   
   # Or directly
   node server.js
   ```

The server will run on `http://localhost:8000`

---

## 🚀 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication
Most endpoints require a JWT token in the auth-token header:
```
auth-token: YOUR_JWT_TOKEN_HERE
```

---

## 👥 User Routes

### 1. Register User
**POST** `/api/users/register`

**Body:**
```json
{
  "name": {
    "first": "John",
    "middle": "James",
    "last": "Doe"
  },
  "phone": "0527111111",
  "email": "john@example.com",
  "password": "Password123!",
  "image": {
    "url": "https://example.com/image.jpg",
    "alt": "User profile image"
  },
  "address": {
    "state": "California",
    "country": "USA",
    "city": "Los Angeles",
    "street": "Main Street",
    "houseNumber": "123",
    "zip": "12345"
  },
  "isBusiness": true,
  "isAdmin": false
}
```

**Password Requirements:**
- Minimum 6 characters
- At least 1 lowercase letter
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character (.!_@#$%^&*-)

### 2. Login User
**POST** `/api/users/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Get Current User Profile
**GET** `/api/users/currentUser`

**Headers:**
```
auth-token: YOUR_JWT_TOKEN
```

### 4. Get All Users (Admin/Business only)
**GET** `/api/users/all`

**Headers:**
```
auth-token: YOUR_JWT_TOKEN
```

### 5. Get User by ID
**GET** `/api/users/profile/:id`

**Example:**
```
GET /api/users/profile/696e860df379fa5e50f53d4b
```

**Headers:**
```
auth-token: YOUR_JWT_TOKEN
```

### 6. Update User
**PUT** `/api/users/update/:id`

**Headers:**
```
auth-token: YOUR_JWT_TOKEN
```

**Body:** (Same structure as register, but all fields optional)
```json
{
  "name": {
    "first": "Updated Name"
  },
  "phone": "0521234567"
}
```

### 7. Delete User
**DELETE** `/api/users/:id`

**Example:**
```
DELETE /api/users/696e860df379fa5e50f53d4b
```

**Headers:**
```
auth-token: YOUR_JWT_TOKEN
```

### 8. Toggle Business Status
**PATCH** `/api/users/business/:id`

**Headers:**
```
auth-token: YOUR_JWT_TOKEN
```

---

## 💼 Card Routes

### 1. Create New Card
**POST** `/api/cards/`

**Headers:**
```
auth-token: YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "title": "My Business",
  "subtitle": "Professional Services",
  "description": "We provide excellent services",
  "phone": "0527111111",
  "email": "business@example.com",
  "web": "https://mybusiness.com",
  "image": {
    "url": "https://example.com/business-logo.jpg",
    "alt": "Business logo"
  },
  "address": {
    "state": "California",
    "country": "USA",
    "city": "Los Angeles",
    "street": "Business Ave",
    "houseNumber": "456",
    "zip": "12345"
  },
  "bizNumber": 1234567,
  "user_id": "696e860df379fa5e50f53d4b"
}
```

### 2. Get All Cards (Public)
**GET** `/api/cards/`

**No authentication required**

### 3. Get My Cards
**GET** `/api/cards/my-cards`

**Headers:**
```
auth-token: YOUR_JWT_TOKEN
```

### 4. Get Card by ID
**GET** `/api/cards/:id`

**Example:**
```
GET /api/cards/696e860df379fa5e50f53d4c
```

**No authentication required**

### 5. Update Card
**PUT** `/api/cards/:id`

**Headers:**
```
auth-token: YOUR_JWT_TOKEN
```

**Body:** (Same structure as create card, all fields optional)
```json
{
  "title": "Updated Business Name",
  "description": "Updated description"
}
```

### 6. Delete Card
**DELETE** `/api/cards/:id`

**Example:**
```
DELETE /api/cards/696e860df379fa5e50f53d4c
```

**Headers:**
```
auth-token: YOUR_JWT_TOKEN
```

### 7. Like/Unlike Card
**PATCH** `/api/cards/like/:id`

**Example:**
```
PATCH /api/cards/like/696e860df379fa5e50f53d4c
```

**Headers:**
```
auth-token: YOUR_JWT_TOKEN
```

### 8. Update Business Number
**PATCH** `/api/cards/bizNumber/:id`

**Headers:**
```
auth-token: YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "bizNumber": 9876543
}
```

---

## 🧪 Testing with Postman

### Step-by-Step Testing Guide:

#### 1. **Register a New User**
- Method: `POST`
- URL: `http://localhost:8000/api/users/register`
- Body Type: `JSON`
- Use the registration body example above

#### 2. **Login to Get Token**
- Method: `POST`
- URL: `http://localhost:8000/api/users/login`
- Body Type: `JSON`
- Copy the returned token for next requests

#### 3. **Test Protected Routes**
- For any route requiring authentication:
  - Go to Headers tab
  - Add: `auth-token` with value `YOUR_COPIED_TOKEN`

#### 4. **Create a Business Card**
- Method: `POST`
- URL: `http://localhost:8000/api/cards/`
- Headers: Include Authorization token
- Body: Use the card creation example above

#### 5. **Test All Card Operations**
- Get all cards (no auth needed)
- Get your cards (auth required)
- Update/Delete your cards (auth required)
- Like cards (auth required)

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format:
```json
{
  "error": "Error message here",
  "message": "Detailed error description"
}
```

---

## 🔧 Development Scripts

```bash
# Start server in development mode with auto-restart
npm run dev

# Start server in production mode
npm start

# Start with local database (development)
npm run dev:local

# Start in production with environment variables
npm run start:prod
```

---

## 📁 Project Structure

```
├── middlewares/
│   ├── auth.js          # JWT authentication middleware
│   └── fileLogger.js    # Error logging middleware
├── models/
│   ├── Card.js          # Card schema/model
│   └── User.js          # User schema/model
├── routes/
│   ├── cards.js         # Card-related routes
│   └── users.js         # User-related routes
├── public/
│   ├── index.html       # 404 error page
│   └── index.css        # Styles for error page
├── server.js            # Main application file
├── package.json         # Dependencies and scripts
└── .env                 # Environment variables
```

---

## 🚨 Important Notes

1. **Always use HTTPS in production**
2. **Keep your JWT_SECRET secure and complex**
3. **Validate all user inputs**
4. **Use strong passwords (as per the regex pattern)**
5. **The server logs errors with colored output for debugging**
6. **Database connects to cloud first, then falls back to local**
7. **All business card operations require authentication except viewing public cards**

---

## 👨‍💻 Author

**Alexander Yarovinsky**
- GitHub: [@AlexanderY88](https://github.com/AlexanderY88)

---

## 📄 License

This project is licensed under the ISC License. :) 