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

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  if (!videoId) {
    throw new ApiError(404, "Cannot Find The Video");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1,
              subscribersCount: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        channel: {
          $first: "$channel",
        },
      },
    },
    {
      $project: {
        _id: 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        channel: 1,
        views: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!video.length) {
    throw new ApiError(404, "Cannot Find The Video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video Fetched Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoId } = req.params;
  const user = req?.user;
  let newThumbnail;
  //TODO: update video details like title, description, thumbnail

  if (!title || !description) {
    throw new ApiError(422, "All Fields Are Required");
  }

  const localThumbnailPath = req.file?.path;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  if (!videoId) {
    throw new ApiError(404, "Cannot Find The Video");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Cannot Find The Video");
  }

  //Check if video owner and the user updating it are same or not
  if (!video?.owner.equals(user?._id)) {
    throw new ApiError(401, "Unauthorized Request");
  }

  //Only Upload On Cloudinary If Thumbnail File Was Uploaded
  if (localThumbnailPath) {
    newThumbnail = await uploadOnCloudinary(localThumbnailPath);
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    video?._id,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: newThumbnail?.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req?.user;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  if (!videoId) {
    throw new ApiError(404, "Cannot Find The Video");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Cannot Find The Video");
  }

  if (!video?.owner.equals(user?._id)) {
    throw new ApiError(401, "Unauthorized Request");
  }

  const updatedStatus = await Video.findByIdAndUpdate(
    video?._id,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedStatus,
        `Published Toggle to: ${updatedStatus?.isPublished}`
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
