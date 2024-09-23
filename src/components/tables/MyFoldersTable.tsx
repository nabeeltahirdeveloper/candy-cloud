import React, { useEffect, useState } from "react";
import {
  Typography,
  message,
  Button,
  Modal,
  Input,
  Dropdown,
  Menu,
  Select,
} from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import folderIcon from "../../assets/icons/folder-icon.svg"; // Use your folder icon here
import foldersApi from "../../api/foldersApi";
import axios from "axios";
import Cookies from "js-cookie";
import { Link, useNavigate } from "react-router-dom";

const { Option } = Select;

interface DataType {
  id: string | number;
  name: string;
  file_name: string;
  updated_at: string;
  type?: string; // This should indicate if it's a folder or file
  subfolders?: DataType[];
}

const MyFoldersTable = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [breadcrumbPath, setBreadcrumbPath] = useState([{ id: 'root', name: 'Home' }]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<DataType[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null);
  const [modalType, setModalType] = useState<"add" | "copy" | null>(null);
  const [nameInput, setNameInput] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      await foldersApi.getFolders((folders) => {
        setData(folders);
      });
    };
    fetchData();
  }, []);

  const fetchAvailableFolders = async () => {
    try {
      await foldersApi.getFolders((folders) => {
        setAvailableFolders(folders);
      });
    } catch (error) {
      console.error("Error fetching available folders:", error);
    }
  };

  const showCopyModal = (fileId: string) => {
    setSelectedFileId(fileId);
    setModalType("copy");
    fetchAvailableFolders();
    setIsModalVisible(true);
  };

  const showAddModal = (folderId: string) => {
    setSelectedFileId(folderId);
    setModalType("add");
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedFileId(null);
    setSelectedDestinationId(null);
    setNameInput("");
  };

  const handleCopyFile = async () => {
    if (!selectedFileId || !selectedDestinationId) {
      message.error("Please select a destination folder");
      return;
    }

    const token = Cookies.get("user");

    try {
      const data = {
        entryIds: [selectedFileId],
        destinationId: selectedDestinationId,
      };

      const config = {
        method: "POST",
        url: `${import.meta.env.VITE_API_URL}/v1/file-entries/duplicate`,
        data: data,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.request(config);
      message.success("File copied successfully!");
      setIsModalVisible(false);
      setSelectedFileId(null);
      setSelectedDestinationId(null);
    } catch (error) {
      message.error("Error copying file");
      console.error("Error copying file:", error);
    }
  };

  const handleAddFolder = async () => {
    if (!nameInput) {
      message.error("Folder name cannot be empty");
      return;
    }

    try {
      await foldersApi.createFolder(selectedFileId!, nameInput);
      message.success("Folder added successfully");
      await foldersApi.getFolders((folders) => {
        setData(folders);
      });
      setIsModalVisible(false);
      setNameInput("");
    } catch (error) {
      message.error("Error adding folder");
      console.error(error);
    }
  };

  const handleRightClick = (event: { preventDefault: () => void; }, folderId: React.SetStateAction<string | null>) => {
    event.preventDefault(); // Prevent the default context menu
    setSelectedFileId(folderId);
    setIsModalVisible(true); // Open the modal on right-click
  };

  const menu = (fileId: string | number) => (
    <Menu>
      <Menu.Item key="add" onClick={() => showAddModal(fileId.toString())}>
        Add Folder
      </Menu.Item>
      <Menu.Item key="copy" onClick={() => showCopyModal(fileId.toString())}>
        Copy Folder
      </Menu.Item>
    </Menu>
  );

  const handleFolderClick = (folder: DataType) => {
    // setBreadcrumbPath(prev => [...prev, { id: folder.id.toString(), name: folder.name }]);
    navigate("/drive/folder", {
      state: { id: folder.id, name: folder.file_name, folder },
    });
  };
  // const renderBreadcrumbs = () => {
  //   return (
  //     <div>
  //       {breadcrumbPath.map((crumb, index) => (
  //         <span key={crumb.id}>
  //           {index > 0 && " > "}
  //           <Link to={`/drive/folder/${crumb.id}`} onClick={() => setBreadcrumbPath(breadcrumbPath.slice(0, index + 1))}>
  //             {crumb.name}
  //           </Link>
  //         </span>
  //       ))}
  //     </div>
  //   );
  // };

  return (
    <div className="p-6">
        {/* {renderBreadcrumbs()} */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-6">
        {data
          .filter((folder) => folder.type === "folder") // Show only folder types
          .map((folder) => (
            <div
              key={folder.id}
              className="bg-white shadow-lg rounded-2xl p-4 relative"
              onContextMenu={(event) => handleRightClick(event, folder.id.toString())} // Attach the right-click handler
            >
              <div className="flex gap-1 items-center">
                {/* Folder Name */}
                <img src={folderIcon} alt="Folder Icon" className="h-6 w-6" />
                <Typography.Title
                  level={5}
                  className=" mt-2 font-medium cursor-pointer w-28 truncate"
                  onClick={() => handleFolderClick(folder)}
                >
                  {folder.file_name}
                </Typography.Title>
                {/* Folder Icon on the right */}
              <Typography.Text className="text-xs text-gray-500 ml-8">
                {new Date(folder.updated_at).toLocaleDateString()}
              </Typography.Text>
              </div>

              {/* Dropdown for actions */}
              <div className="absolute top-2 right-2">
                <Dropdown overlay={menu(folder.id)} trigger={["click"]}>
                  <Button type="text" icon={<EllipsisOutlined />} />
                </Dropdown>
              </div>
            </div>
          ))}
      </div>

      <Modal
        title={modalType === "copy" ? "Copy to Destination" : "Add New Folder"}
        visible={isModalVisible}
        onOk={modalType === "copy" ? handleCopyFile : handleAddFolder}
        onCancel={handleCancel}
        okText={modalType === "copy" ? "Copy" : "Add"}
        cancelText="Cancel"
      >
        {modalType === "copy" ? (
          <>
            <Typography>Select the destination folder:</Typography>
            <Select
              className="w-full"
              placeholder="Select folder"
              onChange={(value) => setSelectedDestinationId(value)}
            >
              {availableFolders.map((folder) => (
                <Option key={folder.id} value={folder.id}>
                  {folder.name}
                </Option>
              ))}
            </Select>
          </>
        ) : (
          <>
            <Typography>Enter the new folder name:</Typography>
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="New folder name"
              className="w-full"
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default MyFoldersTable;
