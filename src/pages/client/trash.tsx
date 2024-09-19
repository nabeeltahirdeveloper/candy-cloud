import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  Typography,
  Spin,
  Button,
  Popconfirm,
  message,
  Modal,
  Row,
  Col
} from 'antd';
import { EyeOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';
import FileViewer from 'react-file-viewer';

const { Title, Text } = Typography;

interface DeletedFile {
  key: string;
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
  const [selectedFile, setSelectedFile] = useState<DeletedFile | null>(null);
  const token = Cookies.get('user');

  useEffect(() => {
    const fetchDeletedFiles = async () => {
      const base_url = import.meta.env.VITE_API_URL;
      try {
        const response = await axios.get(`${base_url}/v1/drive/file-entries?deletedOnly=true`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const files = response.data.data.map((file: { id: any; name: any; deletedAt: string | number | Date | dayjs.Dayjs | null | undefined; url: any; extension: any; }) => ({
          key: file.id,
          id: file.id,
          name: file.name,
          deletedAt: dayjs(file.deletedAt).format("YYYY-MM-DD HH:mm"),
          url: file.url,
          extension: file.extension
        }));
        setDeletedFiles(files);
        setLoading(false);
      } catch (error) {
        message.error('Failed to fetch deleted files');
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
    if (!selectedFile) return null;
    const filePath = `https://cms.candycloudy.com/${encodeURIComponent(selectedFile.url)}`;
    return (
      <FileViewer
        fileType={selectedFile.extension}
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
      <Title level={2}>Deleted Files</Title>
      <Row gutter={[16, 16]}>
        {deletedFiles.map((file) => (
          <Col key={file.id} xs={24} sm={12} md={8} lg={8}>
            <Card
              hoverable
              style={{ marginBottom: 16 }}
              cover={<img alt="png" src={`https://cms.candycloudy.com/${file.url}`} style={{ height: 180, objectFit: 'cover' }} />}
              actions={[
                <Button icon={<ReloadOutlined />} onClick={() => handleRestore(file.id)}>Restore</Button>,
                <Button icon={<EyeOutlined />} onClick={() => handleFilePreview(file)}>Preview</Button>,
                <Popconfirm
                  title="Are you sure you want to permanently delete this file?"
                  onConfirm={() => handleDeleteFile(file.id)}
                >
                  <Button icon={<DeleteOutlined />} danger>Delete</Button>
                </Popconfirm>
              ]}
            >
              <Card.Meta
                title={<Text strong>{file.name}</Text>}
                description={`Deleted on ${dayjs(file.deletedAt).format("YYYY-MM-DD")}`}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal for file previews */}
      <Modal
        title="File Preview"
        visible={fileViewerModalOpen}
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
function setViewerFileType(extension: string) {
  throw new Error('Function not implemented.');
}

