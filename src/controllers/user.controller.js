import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  if (![username, email, password, fullName].every((field) => field && field.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with same username or email already exists");
  }

  const avatarFile = req.files?.avatar?.[0];
  const coverFile = req.files?.coverImage?.[0];

  if (!avatarFile) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatarUpload = await uploadOnCloudinary(avatarFile.path);
  if (!avatarUpload) {
    throw new ApiError(500, "Avatar upload failed");
  }

  const coverUpload = coverFile ? await uploadOnCloudinary(coverFile.path) : null;

  const newUser = await User.create({
    username: username.trim().toLowerCase(),
    email,
    password,
    fullName,
    avatar: avatarUpload.url,
    coverImage: coverUpload?.url || "",
  });

  const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});

export default registerUser;
