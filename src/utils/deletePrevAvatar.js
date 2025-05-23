import {v2 as cloudinary} from "cloudinary"

const deleteFromCloudinary = async (imageUrl) => {
    try {
        const publicId = imageUrl.split("/").pop().split(".")[0]; // Extract public_id from URL
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting avatar from Cloudinary:", error);
    }
};

export {deleteFromCloudinary}