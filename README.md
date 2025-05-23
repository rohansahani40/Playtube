🎬 PlayTube – Backend API
PlayTube is a backend REST API for a YouTube-like video platform.
It handles user authentication, video upload, storage, and retrieval using Node.js, Express.js, MongoDB, Multer, and Cloudinary.
This project enables secure and scalable video sharing capabilities with JSON Web Token (JWT) authentication.

####   Tech Stack    ####

  Node.js + Express.js – REST API
  MongoDB + Mongoose – Database & ODM
  JWT – Authentication
  Multer – File uploads
  Cloudinary – Cloud storage for videos/images
  bcrypt – Password hashing 
  cookie-parser – For parsing cookies 
  CORS – For handling cross-origin requests
  dotenv – For managing environment variables
  mongoose-aggregate-paginate-v2 – Pagination for Mongoose aggregate queries

  🧪 Features
  
🔐 User Registration & Login (JWT + Cookies)

🎞 Video Upload with Multer
    likes/dislikes/comments functionality
    User profile page with video stats
    Playlist support
    Video tags and search
☁️ Store videos/images on Cloudinary
🔍 Retrieve and paginate videos
🧹 Delete video functionality
🚫 Protected routes using JWT
📦 Modular route and controller structure
🧹CRUD operation on user profile,user video ,playlist, comment etc

🛡️ Middleware
Authentication: Protect routes using JWT tokens in headers or cookies.
Upload: Use Multer to handle multipart/form-data for file uploads.
Cloud Storage: Automatically uploads videos/images to Cloudinary.


Flowchart Overview:

How Routes, Controllers, and Models Work Together in Your Project
Your project follows the MVC (Model-View-Controller) architecture. Below is an overview of how the routes, 
controllers, and models are interconnected and work together.
________________________________________
🛠️ Step-by-Step Flow Explanation
1.	Client Sends a Request
    o	The user interacts with the frontend (e.g., clicks "Like" on a video, posts a tweet, fetches comments).
    o	This triggers an HTTP request (GET, POST, PATCH, DELETE) to the backend API.
  	
3.	Request Reaches the routes File
    o	routes/*.js defines API endpoints.
    o	Calls the appropriate function from controllers/*.js.
    o	Example:
    javascript
  
    router.route("/:videoId").get(getVideoById);
     This calls getVideoById() in video.controller.js.
  	
5.	Controller Handles the Business Logic
      o	controllers/*.js contains logic for processing requests.
      o	Calls the appropriate model/*.js to fetch/update data.
      o	Example:
  	     const video = await Video.findById(videoId);
        This queries MongoDB using the Video model.
  	
4.	Model Interacts with MongoDB
    o	models/*.js defines MongoDB schemas using Mongoose.
    o	Example:
              const videoSchema = new mongoose.Schema({
                  title: { type: String, required: true },
                  views: { type: Number, default: 0 }
              });
    o	Controllers use models to fetch, update, delete, or insert data in MongoDB.

5.	Response is Sent Back to Client
        o	Once the controller processes the request and gets data from MongoDB, it sends a JSON response.
        o	Example:
           return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
        o	The frontend then displays the data to the user.
