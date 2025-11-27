import { uploadImageOnCloudinary } from "./cloudinary.js";
import ApiError from "./ApiError.js";

const uploadSingleImage = async (file, errorMessage) => {
  if (!file) return;

  const uploaded = await uploadImageOnCloudinary(file.path);
  if (!uploaded) {
    throw new ApiError(500, errorMessage);
  }

  return uploaded;
};

export default uploadSingleImage;
