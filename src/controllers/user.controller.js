import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // data validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  // dev testing
  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);

  //data validation - not empty(checked), email validation(future enhancement)
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields Are Required");
  }

  // check if user already exists
  const userExists = User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExists) {
    //feature refinement: can check for email or username separately and throw separate error messages
    throw new ApiError(409, "User with email or username already exists");
  }

  //check for images, check for avatar
  const avatraLocalPath = req.files?.avatar[0]?.path; // files is provided by multer similar to req.body
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatraLocalPath) {
    throw new ApiError(400, "Avater image is required");
  }

  //upload Avatar and Cover Image in cloudinary
  const avatar = await uploadOnCloudinary(avatraLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    //validate if avatar has been uploaded on cloudinary
    throw new ApiError(400, "Avater image is required");
  }

  // create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // remove password and refresh token field from response
  //check if user has been created
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "User Registered Successfully!"));
});

export { registerUser };
