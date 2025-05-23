import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken"
// code error at 430 line after

const generateAccessAndRefreshTokens =async (userId)=>{
  try {
   const user= await User.findById(userId);
   const accessToken= user.generateAccessToken();
   const refreshToken= user.generateRefreshToken();

    user.refreshToken= refreshToken;
    user.save({validateBeforeSave: false});

    return {accessToken,refreshToken}
}
catch(error){

  throw new ApiError(500,"error in generating the access and refresh token")

}
  


}

  //we have to create a register user

const registerUser = asyncHandler(async (req, res) => {
  //taking input from the user frontend
  //validating the input  -not empty
  //checking if the user is already registered or not
  //checking for img,checking for avatar
  //hashing the password
  //upload theme to cloudinary,avatar to cloudinary
  //creating user object,creating object in the database
  //refresh password ,refresh token field from response
  //check for user creation
  //returning the response

  const { fullName, email, username, password} = req.body;
  //console.log("email : ", email);

  //validating the input  -not empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill all the fields");
  }

  //checking if the user is already registered or not

  const userExisted = await User.findOne({
    $or: [{ email }, { username }],
  });
   console.log("userExisted : ", userExisted);
  if (userExisted) {
    throw new ApiError(
      409,
      " the given email and username is already registered,! User already exists"
    );
  }

  //checking for img,checking for avatar

  const avatarLocalPath = req.files?.avatar?.[0]?.path; 
  //acces given by multer middleware
  const coverImagelocalPath = req.files?.coverImage[0]?.path;

  // let coverImageLocalPath;
  //   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
  //       coverImageLocalPath = req.files.coverImage[0].path
  //   }
   console.log("avatarlocalPath : ", avatarLocalPath);

   // console.log("coverImagelocalPath : ", coverImagelocalPath);
  // if (!avatarLocalPath) {
  //   throw new ApiError(400, "error in avatar path");
  // }

  //uploading the image to cloudinary
   const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImagelocalPath);
  //   console.log("avatar : ", avatar);
  // if (!avatar) {
  //   throw new ApiError(400, "Error while uploading avatar image");
  // }
  //creating user object,creating object in the database
  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar?.url||"",
   coverImage: coverImage?.url || "",
  });
  console.log("user : ", user);
  //refresh password ,refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //check for user creation
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});


const loginUser = asyncHandler(async (req, res) => {

  //req body to collect data
  //chack for email and username
  // find the user in the database
  // password check
  //acces and refresh token db se lo
  // send cookie
  //return response

   const{email,username,password}= req.body
   console.log("email",email);
  // if(!email || !username){
  //   throw new ApiError(400,"Please provide email or username it is required")
  // }

  if (!(email || username)){
       throw new ApiError(400,"Please provide email or username it is required")
  }
  const user  =   await User.findOne({  
    $or:[{email},{username}]
  })
  if(!user){
    throw new ApiError(404,"user does not exist with this email or username")
  }
  
  const isPasswordValid = await user.isPasswordCorrect(password)
  if(!isPasswordValid){
    throw new ApiError(401,"password is incorrect")
  } 

  const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)




  User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly:true,
    loginUser:true
  }
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json
  (
    new ApiResponse(
                      200,
                      {
                        user:loginUser ,accessToken, refreshToken    
                      },
                     " user logged in successfully"
                   )
  )
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, 
      {
       $unset: { refreshToken:1}
      },
      { new: true 

      }
      );
      const options={
        httpOnly:true,
        secure:true
      }
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{}, "user logged out successfully")); 

 });

 const refreshAccessToken= asyncHandler(async (req,res)=>{
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken

    if(incomingRefreshToken){
      throw new ApiError (401,"unauthorised request")
    }
   
try {
      const decodedToken= jwt.verify(
       incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      )
  
     const user = await User.findById(decodedToken?._id)
     if(!user){
      throw new ApiError (401,"invalid refresh token")
    }
      
    if (incomingRefreshToken !== user?.refreshToken){
      throw new ApiError (401,"refresh token is used or expired")
    }
    
  
    const options={
      httpOnly:true,
      secure:true
    }
  
    const {accessToken,newRefreshToken}= await generateAccessAndRefreshTokens(user._id)
    
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Acess token is refreshed"
      )
    )
} catch (error) {
    throw new ApiError(401 ,"unauthorized request")

}

 })

const changeCurrentPassword= asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body
   const user=await User.findById(req.user?._id)
   const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
   if(!isPasswordCorrect){
    throw new ApiError(400,"invalid old password")
    
   }
  user.password=newPassword
 await user.save({validateBeforeSave:false})

 return res
 .status(200)
 .json(200,{},"password is change successfully")
})


const getCurrentUser= asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(200,res.user,"current user fetch successfully")
 
})

const updateAccountDetails= asyncHandler(async(req,res)=>{
  const {fullName,email}=  await req.body

  if(!fullName || !email){
    throw new ApiError(400,"username or email is required")

  }
   const user= await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        fullName:fullName,
        email:email
      }
   },
   {new:true}).select("-password")

   return res
   .status(200)
   .json(
    new ApiResponse(200,user,"user datails got updated successfully"))
})


const updateUserAvatar= asyncHandler(async(req,res)=>{
const avatarLocalPath= req.file?.path

if(!avatarLocalPath){
   throw new ApiError(400," avatar file is missing")
}
//delete the prev avatar
const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    if (user.avatar) {
      await deleteFromCloudinary(user.avatar);
  }
  //yaha tak chat gpt

  const avatar= await uploadOnCloudinary(avatarLocalPath)
  if(!avatar.url){
    throw new ApiError(400," error while uploading the avatar")
  }
  const updateduser= await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        avatar:avatar.url

      }
   },
   {new:true}).select("-password")
return res 
      .status(200)
      .json(200,
        new ApiResponse (200,"user avatar is updated successfully")
      )
})

const updateUserCoverImage= asyncHandler(async(req,res)=>{
const coverImageLocalPath= req.file?.path

if(!coverImageLocalPath){
   throw new ApiError(400," cover Image file is missing")
}
  const coverImage= await uploadOnCloudinary(coverImageLocalPath)
  if(!coverImage.url){
    throw new ApiError(400," error while uploading the cover Image")
  }
  const user= await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        coverImage:coverImage.url

      }
   },
   {new:true}).select("-password")
return res 
      .status(200)
      .json(200,
        new ApiResponse (200,"user cover Image is updated successfully")
      )
})

const getUserChannelProfile = asyncHandler(async (req,res)=>{

const {username}=req.params
if(!username?.trim()){
  throw new ApiError(400,"username is missing")


}

const channel = await User.aggregate([
  {
      $match: {
          username: username?.toLowerCase()
      }
  },
  {
      $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"
      }
  },
  {
      $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo"
      }
  },
  {
      $addFields: {
          subscribersCount: {
              $size: "$subscribers"
          },
          channelsSubscribedToCount: {
              $size: "$subscribedTo"
          },
          isSubscribed: {
              $cond: {
                  if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                  then: true,
                  else: false
              }
          }
      }
  },
  {
      $project: {
          fullName: 1,
          username: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1

      }
  }
])
 
if(!channel?.length){
  throw new ApiError(404, "Channel not found");
}

return res
        .status(200)
        .json(
          new ApiResponse(200,channel[0],"user channel fethch successfully")
        )

})

const getWatchHistory = asyncHandler(async(req,res)=>{
  const user =await  User.aggregate([
    {
      $match: {
          _id: new mongoose.Types.ObjectId(req.user._id)
      }
  },
  {
      $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
              {
                  $lookup: {
                      from: "users",
                      localField: "owner",
                      foreignField: "_id",
                      as: "owner",
                      pipeline: [
                          {
                              $project: {
                                  fullName: 1,
                                  username: 1,
                                  avatar: 1
                              }
                          }
                      ]
                  }
              },
              {
                  $addFields:{
                      owner:{
                          $first: "$owner"
                      }
                  }
              }
          ]
      }
  }
  ])

  return res 
         .status(200)
         .json(
          new ApiResponse(200,
            user[0].getWatchHistory ,
            "watch history fetch successfully"

          )
         )
})


export { 
  registerUser ,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getWatchHistory,
  getUserChannelProfile
};
 