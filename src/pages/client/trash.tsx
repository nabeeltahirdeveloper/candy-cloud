import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  List,
  Typography,
  Spin,
  message,
  Button,
  Popconfirm,
  Modal,
} from "antd";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import FileViewer from "react-file-viewer"; // For file viewing

interface DeletedFile {
  id: string;
  name: string;
  deletedAt: string;
  url: string;
  extension: string;
}

const Trash = () => {
  const [deletedFiles, setDeletedFiles] = useState<DeletedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileViewerModalOpen, setFileViewerModalOpen] = useState(false);
  const [viewerFileType, setViewerFileType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<DeletedFile | null>(null);
  const token = Cookies.get("user");

  useEffect(() => {
    const fetchDeletedFiles = async () => {
      const base_url = import.meta.env.VITE_API_URL;
      try {
        const response = await axios.get(
          `${base_url}/v1/drive/file-entries?deletedOnly=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setDeletedFiles(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching deleted files:", error);
        message.error("Failed to fetch deleted files");
        setLoading(false);
      }
    };

    fetchDeletedFiles();
  }, [token]);

  const handleRestore = async (fileId: string) => {
    const base_url = import.meta.env.VITE_API_URL;
    try {
      await axios.post(
        `${base_url}/v1/file-entries/restore`,
        { entryIds: [fileId] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      message.success("File restored successfully!");
      const response = await axios.get(
        `${base_url}/v1/drive/file-entries?deletedOnly=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setDeletedFiles(response.data.data);
    } catch (error) {
      console.error("Error restoring file:", error);
      message.error("Failed to restore file");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const base_url = import.meta.env.VITE_API_URL;
    try {
      const formData = new FormData();
      formData.append("soft", "true");
      await axios.delete(`${base_url}/v1/files/${fileId}`, {
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      message.success("File permanently deleted!");
      const response = await axios.get(
        `${base_url}/v1/drive/file-entries?deletedOnly=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setDeletedFiles(response.data.data);
    } catch (error) {
      console.error("Error deleting file:", error);
      message.error("Failed to delete file");
    }
  };

  const handleFilePreview = (file: DeletedFile) => {
    setSelectedFile(file);
    setViewerFileType(file.extension); // Set the file type for preview
    setFileViewerModalOpen(true); // Open the modal
  };

  const renderFileViewer = () => {
    const filePath = `https://cms.candycloudy.com/${encodeURIComponent(
      selectedFile?.url || ""
    )}`;

    if (!selectedFile || !viewerFileType) return null;

    console.log("File Path for Viewing:", filePath);
    console.log("File Type for Viewing:", viewerFileType);

    // Render the iframe gallery for image files
    if (
      viewerFileType === "jpg" ||
      viewerFileType === "jpeg" ||
      viewerFileType === "png"
    ) {
      return (
        <iframe
          src={filePath}
          style={{ width: "100%", height: "750px", border: "none" }}
          title="Image Viewer"
          onError={(e) => console.error("Error loading image:", e)} // Log any iframe load errors
        />
      );
    }

    if (viewerFileType === "pdf") {
      return (
        <iframe
          src={`https://docs.google.com/viewer?url=${filePath}&embedded=true`}
          style={{ width: "100%", height: "750px", border: "none" }}
          title="PDF Viewer"
          onError={(e) => console.error("Error loading PDF:", e)} // Log any iframe load errors
        />
      );
    }

    // Use FileViewer as fallback for other file types
    return (
      <FileViewer
        fileType={viewerFileType}
        filePath={filePath}
        onError={(e) => console.log("Error displaying file:", e)}
      />
    );
  };

  if (loading) {
    return <Spin tip="Loading deleted files..." />;
  }

  return (
    <div>
      <Typography.Title level={2}>Deleted Files</Typography.Title>
      {deletedFiles.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={deletedFiles}
          renderItem={(file) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  onClick={() => handleRestore(file.id)}
                  key={`restore-${file.id}`}
                >
                  Restore
                </Button>,
                <Button
                  type="default"
                  onClick={() => handleFilePreview(file)}
                  key={`preview-${file.id}`}
                >
                  Preview
                </Button>,
                <Popconfirm
                  title="Are you sure to permanently delete this file?"
                  onConfirm={() => handleDeleteFile(file.id)}
                  okText="Yes"
                  cancelText="No"
                  key={`delete-${file.id}`}
                >
                  <Button type="default" danger>
                    Delete
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={file.name}
                description={`Deleted on: ${dayjs(file.deletedAt).format(
                  "YYYY-MM-DD HH:mm:ss"
                )}`}
              />
            </List.Item>
          )}
        />
      ) : (
        <Typography.Text>No deleted files found.</Typography.Text>
      )}

      {/* Modal for file previews */}
      <Modal
        title="File Preview"
        open={fileViewerModalOpen}
        onCancel={() => setFileViewerModalOpen(false)}
        footer={null}
        width={800}
      >
        {renderFileViewer()}
      </Modal>
    </div>
  );
};

export default Trash;
