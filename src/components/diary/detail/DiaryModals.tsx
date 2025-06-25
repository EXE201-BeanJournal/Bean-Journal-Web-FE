import React from "react";
import { Modal as AntModal } from "antd";
import { FaFacebook, FaLinkedin } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";

interface DiaryModalsProps {
  isDeleteConfirmVisible: boolean;
  handleDeleteConfirmOk: () => void;
  handleDeleteConfirmCancel: () => void;
  diaryTitle: string;
  isVideoModalVisible: boolean;
  currentVideoUrl: string | null;
  handleVideoModalCancel: () => void;
  isShareConfirmVisible: boolean;
  handleShareConfirmOk: () => void;
  handleShareConfirmCancel: () => void;
  sharePreviewImageUri: string | null;
  sharePlatform: "facebook" | "linkedin" | null;
}

const DiaryModals: React.FC<DiaryModalsProps> = ({
  isDeleteConfirmVisible,
  handleDeleteConfirmOk,
  handleDeleteConfirmCancel,
  diaryTitle,
  isVideoModalVisible,
  currentVideoUrl,
  handleVideoModalCancel,
  isShareConfirmVisible,
  handleShareConfirmOk,
  handleShareConfirmCancel,
  sharePreviewImageUri,
  sharePlatform,
}) => {
  const platformName =
    sharePlatform === "facebook"
      ? "Facebook"
      : sharePlatform === "linkedin"
      ? "LinkedIn"
      : "";

  const PlatformIcon =
    sharePlatform === "facebook"
      ? FaFacebook
      : sharePlatform === "linkedin"
      ? FaLinkedin
      : null;

  const platformColor =
    sharePlatform === "facebook" ? "text-blue-600" : "text-blue-800";

  return (
    <>
      {currentVideoUrl && (
        <AntModal
          open={isVideoModalVisible}
          title="Video Preview"
          footer={null}
          onCancel={handleVideoModalCancel}
          destroyOnClose={false}
          centered
          width="80vw"
          styles={{ body: { padding: 0, lineHeight: 0 } }}
        >
          <video
            src={currentVideoUrl}
            controls
            autoPlay
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </AntModal>
      )}

      <AntModal
        title={
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="w-6 h-6 text-red-500" />
            <span className="font-semibold text-xl text-gray-800">
              Confirm Deletion
            </span>
          </div>
        }
        open={isDeleteConfirmVisible}
        onOk={handleDeleteConfirmOk}
        onCancel={handleDeleteConfirmCancel}
        okText="Delete"
        okButtonProps={{ danger: true, className: "bg-red-500 hover:bg-red-600" }}
        cancelText="Cancel"
      >
        <div className="py-4">
          <p className="text-base text-gray-700">
            Are you sure you want to delete this diary entry titled{" "}
            <strong className="font-medium text-gray-900">"{diaryTitle}"</strong>?
          </p>
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
            <p className="text-sm font-semibold text-red-700">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>
      </AntModal>

      <AntModal
        title={
          <div className="flex items-center gap-3">
            {PlatformIcon && <PlatformIcon className={`w-6 h-6 ${platformColor}`} />}
            <span className="font-semibold text-xl text-gray-800">
              Share to {platformName}
            </span>
          </div>
        }
        open={isShareConfirmVisible}
        onOk={handleShareConfirmOk}
        onCancel={handleShareConfirmCancel}
        okText="Yes, share it!"
        cancelText="Cancel"
        width={600}
        okButtonProps={{ className: "bg-blue-500 hover:bg-blue-600" }}
      >
        <div className="py-4">
          <p className="text-lg text-gray-700">
            A preview of your journal entry will be shared on your{" "}
            <strong className={`font-semibold ${platformColor}`}>
              {platformName}
            </strong>{" "}
            timeline.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Please confirm the preview below looks correct.
          </p>
          {sharePreviewImageUri && (
            <div className="mt-4 border-2 border-dashed border-gray-200 rounded-lg p-2 bg-gray-50 shadow-inner">
              <img
                src={sharePreviewImageUri}
                alt="Journal entry share preview"
                className="w-full h-auto rounded-md"
              />
            </div>
          )}
        </div>
      </AntModal>
    </>
  );
};

export default DiaryModals; 