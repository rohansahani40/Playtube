import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
// import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

 /*
 Video Fetching Process Notes:
  👉 Why do we use $regex for query search?
     - $regex allows partial matching (e.g., searching "fun" will find "funny video").
     - $options: "i" makes it case-insensitive (e.g., "FUN" and "fun" are treated the same).
  👉 What is $lookup and why do we need it?
     - $lookup helps us fetch user details related to each video.
     - Without this, we'd have to make multiple queries to get the same info!
  👉 Why do we use pagination ($skip and $limit)?
     - Instead of loading ALL videos at once (which would be slow), we fetch them in chunks.
     - $skip skips already displayed videos, and $limit ensures we only fetch a limited number.
  👉 What happens if there are no videos found?
     - If the database has no videos matching the filters, we send a 404 error.
     - This prevents sending an empty list without explanation.
*/
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    if (!req.user) {
        throw new ApiError(401, "User needs to be logged in");
      }
    const match={ ...(query ? { title: { $regex: query, $options: "i" } } : {}),
     // If query exists, match titles that contain the search term (case-insensitive)
    ...(userId ? { owner: mongoose.Types.ObjectId(userId) } : {}), 
    // If userId exists, filter videos by that owner
  };
  const videos = await Video.aggregate([
    {
     
      $match: match, // Filtering videos based on the match criteria
    },
    {
        $lookup: {
            from: "users", // Collection name
            localField: "owner", // Field in the videos collection
            foreignField: "_id", // Field in the users collection
            as: "videosByowner", // Output array field
        },
        },
        {
        $unwind: "$owner", // Deconstructing the owner array
        },
        {
        $project: {
        // Projecting the fields to be returned
            _id: 1,
            title: 1,
            description: 1,
            thumbnail: 1,
            views: 1,
            createdAt: 1,
            owner: {
            _id: 1,
            name: 1,
            email: 1,
            },
        },
        },
        {
        $sort: {
            [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1, // Sorting based on sortBy field in ascending or descending order
        },
        },
        {
        $facet: {
            // Facet stage to get the total count of videos and paginated videos
            videos: [{ $skip: (page - 1) * limit }, { $limit: limit }], // Pagination
            totalCount: [{ $count: "count" }], // Getting the total count of videos
        },
    }
  ])

  if(!videos?.length){
      throw new ApiError(404, "No video found")
  }
   return res
    .status(200)
    .json(new ApiResponse(200,videos, "Videos fetched successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description,owner} = req.body
    // TODO: get video, upload to cloudinary, create video
     /*
 Video Publishing Notes:
👉 Why do we upload the video and thumbnail to Cloudinary?
   - Storing large video files on the server isn't scalable.
   - Cloudinary provides a CDN, making videos load faster.
👉 Why store the duration in the database?
   - Duration helps in displaying video length without reprocessing the file.
   - It improves user experience and optimizes video streaming.
*/

    if(!description ){
        throw new ApiError(400, " description is required")
    }
    if(!title){
        throw new ApiError(400, "Title is required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    if(!videoLocalPath){
        throw new ApiError(400, "Video file is required")
    }
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    }
    //const duration = await getVideoDuration(videoLocalPath);

    const videoFile = await uploadOnCloudinary(videoLocalPath, "video");
    if(!videoFile){
        throw new ApiError(500, "cloudinary Error: Error uploading video")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, "image");
    if(!thumbnail){
        throw new ApiError(500, "cloudinary Error: Error uploading thumbnail")
    }
    
    const newVideo = await Video.create({
       
        videoFile:videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        category: "General",
       
        owner: req.user?._id,
        publishStatus: false,
    })
    console.log(` Title: ${title}, Owner: ${owner}`);

    // If video creation fails, throw an error
    if (!newVideo) {
      throw new ApiError(500, "Something went wrong while publishing a video");
    }

    return res 
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video published successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
     /* 
     Query the database to find the video by its ID.
    - The `findById` method is used to retrieve a specific document using its _id.
    - `populate("owner", "name email")` fetches additional details about the video's owner.
      - Instead of just storing the owner's ID, this will return their name and email too.
      - This is helpful for frontend applications that want to display the owner's info.
  */
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
      }
      const video = await Video.findById(videoId).populate("owner", "name email");
      if (!video) {
        throw new ApiError(404, "Video not found");
      }
        return res
            .status(200)
            .json(new ApiResponse(200, video, "Video fetched successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
   
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    const { title, description } = req.body;
    if (!title && !description) {
      throw new ApiError(400, "Title or description is required");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
     let updateData = { title, description };
     if (req.file) {
                const thumbnailLocalPath = req.file.path;
            
                if (!thumbnailLocalPath) {
                throw new ApiError(400, "Thumbnail file is missing");
                }
            
                // Upload the thumbnail to Cloudinary
                const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
            
                if (!thumbnail.url) {
                throw new ApiError(400, "Error while updating thumbnail");
                }
                    
                // Add the new thumbnail URL to the updateData
                updateData.thumbnail = thumbnail.url;
                }
/*
    Update the video document in the database:
    - `findByIdAndUpdate` searches for the video by its ID.
    - `$set: updateData` updates only the provided fields.
    - `{ new: true, runValidators: true }`
      - `new: true` returns the updated document instead of the old one.
      - `runValidators: true` ensures data validation rules are applied.
  */

    const updatedVideo = await Video.findByIdAndUpdate
    (videoId, { $set: updateData }, { new: true, runValidators: true });
    if (!updatedVideo) {
        throw new ApiError(404, "Error while updating video");
    }
    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
    /* 
    Video Update Notes:
👉 Why do we use `findByIdAndUpdate` instead of `save()`?
   - `findByIdAndUpdate` allows us to update only specific fields, reducing unnecessary data writes.
   - `save()` is useful when we want to modify and validate an entire document.
👉 Why do we check for `req.file` before updating the thumbnail?
   - Not all updates require a new thumbnail, so we update it only if a new file is provided.
   - This prevents unnecessary file uploads and saves storage space.
👉 What happens if Cloudinary upload fails?
   - The function throws an error before making any database changes, ensuring data integrity.
   - This prevents storing an invalid or missing thumbnail URL in the database.
👉 Why use `{ new: true, runValidators: true }`?
   - `new: true`: Returns the updated document immediately after modification.
   - `runValidators: true`: Ensures any schema validation rules (like required fields) are enforced. 
   
   */
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    const deletedVideo= await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(404, "Video not found")
    }   
    return res  
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    /* 
 Toggling Publish Status Notes:
👉 What happens when `findById(videoId)` is called?
   - The function searches the database for a document with the given ID.
   - If found, it returns the video document.
   - If not found, we throw a `404` error to indicate the video doesn't exist.
👉 How does toggling `isPublished` work?
   - `video.isPublished = !video.isPublished;`
   - This flips the boolean value (`true` → `false`, `false` → `true`).
   - It effectively acts as a switch between published and unpublished states.
👉 Why do we call `video.save()`?
   - Changes made to a Mongoose document are not saved automatically.
   - `.save()` commits the updated status to the database.
👉 Alternative ways to toggle a boolean field in MongoDB?
   - Using Mongoose's update function:
     ```
     await Video.findByIdAndUpdate(videoId, { $set: { isPublished: !video.isPublished } }, { new: true });
     ```
   - This method is more concise but requires re-fetching the document to get the updated value.
   
 */
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
      }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
      }
    video.isPublished = !video.isPublished;
    await video.save();
    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video publish status toggle  updated successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}