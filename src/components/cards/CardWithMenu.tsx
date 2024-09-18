import React, { useState, useEffect } from "react";
import {
  Dropdown,
  MenuProps,
  Modal,
  Typography,
  Spin,
  Button,
  Select,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FolderAddOutlined,
  LinkOutlined,
  PlayCircleFilled,
  StarFilled,
  StarOutlined,
  UserAddOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { truncate } from "lodash";
import { convertBytes } from "../../utils/helpers";
import useDisclosure from "../../hooks/useDisclosure";
import ShareFileModal from "../modals/ShareFileModal";
import RenameFileModal from "../modals/RenameFileModal";
import Papa from "papaparse";
import fileImage from "../../assets/images/Frame 427319331.png";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { fetchAddToStar } from "../../api/amt/workspace/AddToStar";
import { fetchRemoveFrStar } from "../../api/amt/workspace/RemoveFrStar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import axios from "axios";
import FileViewer from "react-file-viewer";
import { Option } from "antd/es/mentions";

const { Text } = Typography;

interface FileItem {
  id: string;
  name: string;
  description: string | null;
  file_name: string;
  mime: string;
  file_size: number;
  user_id: number | null;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  path: string;
  disk_prefix: string;
  type: string;
  extension: string;
  public: boolean;
  thumbnail: boolean;
  workspace_id: number;
  owner_id: number;
  hash: string;
  url: string;
  users: Array<{
    email: string;
    id: number;
    avatar: string;
    model_type: string;
    owns_entry: boolean;
    entry_permissions: Array<any>;
    display_name: string;
  }>;
  tags: Array<any>;
  permissions: {
    "files.update": boolean;
    "files.create": boolean;
    "files.download": boolean;
    "files.delete": boolean;
  };
}

interface CardWithMenuProps {
  item: FileItem;
  refreshRecent: () => void;
}

interface StarredItem {
  id: string | number;
}

export default function CardWithMenu({
  item,
  refreshRecent,
}: CardWithMenuProps) {
  const shareModal = useDisclosure<FileItem>();
  const renameModal = useDisclosure();
  const apiUrl = import.meta.env.VITE_API_URL;
  const starred = useSelector((state: RootState) => state.starred);
  const eleInStar = starred.find((ele: StarredItem) => +ele?.id === +item.id);
  const dispatch = useDispatch();

  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [fileViewerModalOpen, setFileViewerModalOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state for the PDF iframe
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [viewerFileType, setViewerFileType] = useState<string>("");

  // Modals for move and copy actions
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [copyModalVisible, setCopyModalVisible] = useState(false);

  // Selected destination folder
  const [destinationId, setDestinationId] = useState<number | null>(null);

  // Available folders for moving and copying
  const [availableFolders, setAvailableFolders] = useState<FileItem[]>([]);

  // Toggle star for file
  const AddOrRemoveStarr = () => {
    if (eleInStar) {
      fetchRemoveFrStar(item.id, dispatch);
    } else {
      fetchAddToStar(item.id, dispatch);
    }
  };

  const getCookie = (cookieName: string) => {
    const name = cookieName + "=";
    const cookieString = decodeURIComponent(document.cookie);
    const cookie = cookieString
      .split(";")
      .find((cookie) => cookie.trim().startsWith(name));
    return cookie ? cookie.split("=")[1].trim() : null;
  };

  const fetchAvailableFolders = async () => {
    const Token = getCookie("user");
    if (!Token) {
      console.error("User token not found");
      return;
    }
    try {
      const response = await axios.get(`${apiUrl}/v1/drive/file-entries`, {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
      });
      setAvailableFolders(response.data.data); // Assume folders are in response.data.data
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  // Handle "Cut" action: show the modal to select destination
  const handleCutFile = async () => {
    setMoveModalVisible(true);
    await fetchAvailableFolders(); // Load folders when modal opens
  };

  // Handle move file operation
  const handleMoveFile = async () => {
    const Token = getCookie("user");
    if (!destinationId) {
      console.error("Destination folder not selected");
      return;
    }
    try {
      const data = { entryIds: [item.id], destinationId: destinationId };
      await axios.post(`${apiUrl}/v1/file-entries/move`, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Token}`,
        },
      });
      console.log("File moved:", data);
      setMoveModalVisible(false); // Close modal after success
      refreshRecent(); // Refresh the recent view
    } catch (error) {
      console.error("Error moving file:", error);
    }
  };

  // Handle copy file operation
  const handleCopyFileModal = async () => {
    setCopyModalVisible(true);
    await fetchAvailableFolders(); // Load folders when modal opens
  };

  const handleCopyFile = async () => {
    const Token = getCookie("user");
    if (!destinationId) {
      console.error("Destination folder not selected");
      return;
    }
    try {
      const data = { entryIds: [{ fileId: item.id }], destinationId };
      await axios.post(`${apiUrl}/v1/file-entries/duplicate`, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Token}`,
        },
      });
      console.log("File copied:", data);
      setCopyModalVisible(false); // Close modal after success
      refreshRecent(); // Refresh the recent view
    } catch (error) {
      console.error("Error copying file:", error);
    }
  };

  const handleDownloadFile = async () => {
    try {
      const response = await fetch(`https://cms.candycloudy.com/${item.url}`, {
        method: "GET",
      });
      const blob = await response.blob(); // Create a blob from the response
      const downloadUrl = URL.createObjectURL(blob); // Create a URL from the blob
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute('download', item.name); // Suggest a filename for the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl); // Clean up the object URL after download
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };
  

  //  const handleDownloadFile = async () => {
  //    try {
  //      const response = await fetch(`https://cms.candycloudy.com/${item.url}`, {
  //        method: "GET",
  //      });
  //      const blob = await response.blob();
  //      const downloadUrl = URL.createObjectURL(blob);
  //      const link = document.createElement("a");
  //      link.href = downloadUrl;
  //      link.download = item.name; // Specify the file name for the download
  //      document.body.appendChild(link);
  //      link.click();
  //      document.body.removeChild(link);
  //      URL.revokeObjectURL(downloadUrl); // Clean up the object URL after download
  //    } catch (error) {
  //      console.error("Error downloading the file:", error);
  //    }
  //  };

  const items: MenuProps["items"] = [
    {
      label: "Preview",
      key: "0",
      icon: <EyeOutlined />,
      onClick: () => {
        setViewerFileType(item.extension);
        setFileViewerModalOpen(true);
        setLoading(true); // Set loading state when opening modal
      },
    },
    {
      label: "Share",
      key: "1",
      icon: <UserAddOutlined />,
      onClick: () => shareModal.onOpen(item),
    },
    {
      label: "Get link",
      key: "2",
      icon: <LinkOutlined />,
    },
    {
      label: eleInStar ? "Remove from starred" : "Add to starred",
      key: "3",
      icon: eleInStar ? <StarFilled /> : <StarOutlined />,
      onClick: () => AddOrRemoveStarr(),
    },
    {
      label: "Move to",
      key: "4",
      icon: <FolderAddOutlined />,
      onClick: () => handleCutFile(),
    },
    {
      label: "Rename",
      key: "5",
      icon: <EditOutlined />,
      onClick: () => renameModal.onOpen(),
    },
    {
      label: "Make a copy",
      key: "6",
      icon: <CopyOutlined />,
      onClick: () => handleCopyFileModal(),
    },
    {
      label: "Download",
      key: "7",
      icon: <DownloadOutlined />,
      onClick: () => handleDownloadFile(),
    },
    {
      label: "Delete",
      key: "8",
      icon: <DeleteOutlined />,
      onClick: () => handleTrashFile(item.id),
    },
  ];

  const handleTrashFile = async (fileId: string) => {
    const Token = getCookie("user");
    if (Token === null) {
      console.error("User token not found");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("soft", "true");
      await axios.delete(`${apiUrl}/v1/files/${fileId}`, {
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${Token}`,
        },
      });
      refreshRecent(); // Refresh recent files after deleting
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  useEffect(() => {
    Fancybox.bind('[data-fancybox="gallery"]', {
      contentClick: "toggleCover",
    });

    return () => {
      Fancybox.destroy();
    };
  }, []);

  const fetchCsvData = (fileUrl: string) => {
    const csvUrl = `https://cms.candycloudy.com/${encodeURIComponent(fileUrl)}`;
    fetch(csvUrl)
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          complete: (result) => {
            setCsvData(result.data as string[][]);
          },
          header: false,
        });
      })
      .catch((error) => {
        console.error("Error fetching CSV file:", error);
      });
  };

  const renderCsvTable = () => {
    if (!csvData) return null;

    return (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {csvData[0]?.map((header, index) => (
              <th
                key={index}
                style={{ border: "1px solid #ccc", padding: "8px" }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {csvData.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{ border: "1px solid #ccc", padding: "8px" }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderFileViewer = () => {
    const filePath = `https://cms.candycloudy.com/${encodeURIComponent(
      item.url
    )}`;

    switch (viewerFileType) {
      case "pdf":
        return (
          <>
            {loading && (
              <div style={{ textAlign: "center", marginTop: "50px" }}>
                <Spin size="large" /> {/* Spinner while loading */}
              </div>
            )}
            <iframe
              src={`https://docs.google.com/viewer?url=${filePath}&embedded=true`}
              style={{ width: "100%", height: "750px", border: "none" }}
              title="PDF Viewer"
              onLoad={() => setLoading(false)} // Remove spinner after iframe is loaded
            ></iframe>
          </>
        );
      case "csv":
        fetchCsvData(item.url);
        return renderCsvTable();
      case "docx":
        return (
          <FileViewer
            fileType="docx"
            filePath={filePath}
            onError={(e) => console.log("Error displaying DOCX file:", e)}
          />
        );
      case "jpg":
      case "jpeg":
      case "png":
        return (
          <img
            src={filePath}
            alt={item.name}
            style={{ width: "100%", height: "auto" }}
          />
        );
      default:
        return (
          <FileViewer
            fileType={viewerFileType || ""}
            filePath={filePath}
            onError={(e) => console.log("Error displaying file:", e)}
          />
        );
    }
  };

  const handleFilePreview = () => {
    setViewerFileType(item.extension);
    setFileViewerModalOpen(true);
    setLoading(true);
  };

  return (
    <>
      <Dropdown
        trigger={["contextMenu"]}
        onOpenChange={(visible) => setIsDropdownVisible(visible)}
        menu={{ items }}
        overlayStyle={{ minWidth: "auto" }}
      >
        <div
          className="h-fit cursor-pointer flex flex-col overflow-hidden rounded-2xl"
          onClick={handleFilePreview}
        >
          <div className="h-[125px] w-full max-md:h-[200px]">
            {item.type === "image" ? (
              <img
                className="w-full h-full object-cover"
                alt="file"
                src={`https://cms.candycloudy.com/${item.url}` || fileImage}
              />
            ) : item.type === "video" ? (
              <video
                src={`https://cms.candycloudy.com/${item.url}`}
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <FileTextOutlined className="text-5xl text-gray-600" />
              </div>
            )}
          </div>
          <div
            className={`flex flex-col items-center justify-center w-full gap-2 p-2 px-2 duration-150 ${
              isDropdownVisible ? "bg-[#0154A01A]" : "bg-white"
            }`}
          >
            <div className="leading-none flex-center gap-2">
              {item.type === "video" && (
                <PlayCircleFilled className="text-primary-600 text-2xl" />
              )}
              <Text className="text-primary-500">
                {truncate(item.name, { length: 20 })}
              </Text>
            </div>
            <Text className="text-gray-600">
              {convertBytes(item.file_size)}
            </Text>
          </div>
        </div>
      </Dropdown>

      {shareModal.open && shareModal.data && (
        <ShareFileModal
          open={shareModal.open}
          onClose={shareModal.onClose}
          data={shareModal.data}
        />
      )}

      {renameModal.open && (
        <RenameFileModal
          open={renameModal.open}
          onClose={renameModal.onClose}
          fileId={item.id}
          apiUrl={apiUrl}
          refreshRecent={refreshRecent}
        />
      )}

      <Modal
        title="File Preview"
        open={fileViewerModalOpen}
        onCancel={() => setFileViewerModalOpen(false)}
        footer={null}
        width={800}
      >
        {renderFileViewer()}
      </Modal>

      {/* Copy File Modal */}
      <Modal
        title="Copy File"
        open={copyModalVisible}
        onCancel={() => setCopyModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setCopyModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleCopyFile}>
            Copy
          </Button>,
        ]}
      >
        <Typography.Text>Select the destination folder:</Typography.Text>
        <Select
          style={{ width: "100%" }}
          placeholder="Select folder"
          onChange={(value) => setDestinationId(value)}
        >
          {availableFolders?.map((folder) => (
            <Option key={folder.id} value={folder.id}>
              {folder.name}
            </Option>
          ))}
        </Select>
      </Modal>

      {/* Move File Modal */}
      <Modal
        title="Move File"
        open={moveModalVisible}
        onCancel={() => setMoveModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setMoveModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleMoveFile}>
            Move
          </Button>,
        ]}
      >
        <Typography.Text>Select the destination folder:</Typography.Text>
        <Select
          style={{ width: "100%" }}
          placeholder="Select folder"
          onChange={(value) => setDestinationId(value)}
        >
          {availableFolders?.map((folder) => (
            <Option key={folder.id} value={folder.id}>
              {folder.name}
            </Option>
          ))}
        </Select>
      </Modal>
    </>
  );
}
