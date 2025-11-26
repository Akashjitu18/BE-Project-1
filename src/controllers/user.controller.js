import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    throw new ApiError(400, "Username or email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const email = username;

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedINUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedINUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
