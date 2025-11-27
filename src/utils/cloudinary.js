import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import ApiError from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const extractPublicId = (imageUrl) => {
  if (!imageUrl) return null;

  try {
    const parts = imageUrl.split("/");
    const filename = parts.pop(); // last part => abc123.jpg
    return filename.split(".")[0]; // abc123
  } catch {
    return null;
  }
};

const uploadImageOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    if (localFilePath) fs.unlinkSync(localFilePath);
    console.error("❌ Cloudinary Upload Error:", error);
    return null;
  }
};

const deleteImageOnCloudinary = async (publicIdOrUrl) => {
  if (!publicIdOrUrl) return;

  let publicId = publicIdOrUrl;

  if (publicIdOrUrl.startsWith("http")) {
    publicId = extractPublicId(publicIdOrUrl);
  }

  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("❌ Cloudinary Delete Error:", error);
    throw new ApiError(500, "Failed to delete image from Cloudinary");
  }
};

export {
  uploadImageOnCloudinary,
  deleteImageOnCloudinary,
  extractPublicId,
};
