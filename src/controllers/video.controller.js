import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import isValidId from "../utils/isValidId.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

  const options = {
    page: pageNum,
    limit: limitNum,
  };

  const match = {
    isPublished: true,
  };

  if (userId) {
    if (!isValidId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }
    match.owner = new mongoose.Types.ObjectId(userId);
  }

  if (query) {
    match.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  const allowedSortFields = ["createdAt", "views", "duration"];
  const sort = {};

  if (sortBy && allowedSortFields.includes(sortBy)) {
    sort[sortBy] = sortType === "asc" ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }

  const videoAggregate = Video.aggregate([
    { $match: match },
    { $sort: sort },
    {
      $project: {
        title: 1,
        thumbnail: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
      },
    },
  ]);

  const result = await Video.aggregatePaginate(videoAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const user = req?.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const localVideoPath = req.files?.videoFile?.[0]?.path;
  const localThumbnailPath = req.files?.thumbnail?.[0]?.path;

  if (!localVideoPath || !localThumbnailPath) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  const videoFile = await uploadOnCloudinary(localVideoPath);
  const thumbnailFile = await uploadOnCloudinary(localThumbnailPath);

  if (!videoFile || !thumbnailFile) {
    throw new ApiError(500, "Failed to upload video or thumbnail");
  }

  const uploadedVideo = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnailFile.url,
    title,
    description,
    duration: videoFile.duration,
    owner: user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, uploadedVideo, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }

  if (!isValidId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
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
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoId } = req.params;
  const user = req?.user;
  let newThumbnail;

  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }

  if (!isValidId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Authorization check
  if (!video.owner.equals(user?._id)) {
    throw new ApiError(403, "Forbidden");
  }

  const localThumbnailPath = req.file?.path;

  if (localThumbnailPath) {
    newThumbnail = await uploadOnCloudinary(localThumbnailPath);
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    video._id,
    {
      $set: {
        title,
        description,
        thumbnail: newThumbnail?.url || video.thumbnail,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user;

  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }

  if (!isValidId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const deletedVideo = await Video.findOneAndDelete({
    _id: videoId,
    owner: user._id,
  });

  if (!deletedVideo) {
    // Covers both: not found OR not owned (security best practice)
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req?.user;

  if (!isValidId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  if (!videoId) {
    throw new ApiError(400, "Cannot Find The Video");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Cannot Find The Video");
  }

  if (!video?.owner.equals(user?._id)) {
    throw new ApiError(403, "Unauthorized Request");
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
