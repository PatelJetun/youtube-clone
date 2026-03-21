import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const user = req?.user;

  // TODO: get video, upload to cloudinary, create video
  if (!title || !description) {
    throw new ApiError(400, "Invalid or Empty Data");
  }

  const localVideoPath = req.files?.videoFile[0]?.path;
  const localThumbnailPath = req.files?.thumbnail[0]?.path;

  if (!localVideoPath || !localThumbnailPath) {
    throw new ApiError(400, "Video Or Thumbnail Missing");
  }

  const videoFile = await uploadOnCloudinary(localVideoPath);
  const thumbnailFile = await uploadOnCloudinary(localThumbnailPath);

  if (!videoFile || !thumbnailFile) {
    throw new ApiError(400, "Video Or Thumbnail Missing");
  }

  const video = await Video.create({
    videoFile: videoFile?.url,
    thumbnail: thumbnailFile?.url,
    title,
    description,
    duration: videoFile?.duration,
    owner: user?._id,
  });

  const uploadedVideo = await Video.findById(video._id);

  if (!uploadedVideo) {
    throw new ApiError(500, "Something Went Wrong While Uploading Video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, uploadedVideo, "Video Uploaded Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
