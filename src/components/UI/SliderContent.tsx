/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Button,
  Dropdown,
  Image,
  Input,
  MenuProps,
  Modal,
  Typography,
  Progress,
} from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../../src/assets/images/logo@2x.png";
const { Text } = Typography;

import {
  ClockCircleFilled,
  DownOutlined,
  FileOutlined,
  FolderAddOutlined,
  FolderOutlined,
  PlusCircleOutlined,
  ShareAltOutlined,
  StarFilled,
  DeleteFilled,
} from "@ant-design/icons";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import SidebarFolders from "./SidebarFolders";

import BottomMenuCurve from "../../assets/images/bottom-side.png";
import TopMenuCurve from "../../assets/images/top-side.png";
import { TrashIcon } from "../../icons/icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { setCatchFile } from "../../store/slices/GlobalSlice";
import { addFiles } from "../../api/amt/files/addFilesApi";
import axios from "axios";
import { fetchDataRecentView } from "../../api/amt/workspace/recent";
import CardWithMenu from "../cards/CardWithMenu";
import { useFolderContext } from '../../context/FolderContext'; // Adjust the path as necessary

export default function SliderContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch: AppDispatch = useDispatch();
  const isAdminLink = location.pathname.includes("admin");

  const [data, setData] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [token, setToken] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const workspace: any = useSelector((state: RootState) => state.workspace);

  const [showProgressBar, setShowProgressBar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState(0);
  const [currentUploadFileName, setCurrentUploadFileName] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'folder' | null>(null);

  // Helper function to get token from cookies
  const getCookie = (cookieName: string) => {
    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieString = decodeURIComponent(document.cookie);

    const cookie = cookieString
      .split(";")
      .find((cookie) => cookie.trim().startsWith(name));

    return cookie ? cookie.split("=")[1].trim() : null;
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const Token = getCookie("user");

      if (Token === null) {
        console.error("User token not found");
        return;
      }
      setToken(Token);

      setShowProgressBar(true);
      setUploadType('file');
      setUploadProgress(0);
      setCurrentUploadFileName(acceptedFiles[0].name);

      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const binaryData = reader.result;

          if (!binaryData) {
            console.error("Failed to read binary data");
            return;
          }

          const response = await axios.post(
            "https://cms.candycloudy.com/api/v1/s3/simple/presign",
            {},
            {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${Token}`,
              },
            }
          );

          const extractedKey = response.data.key.split("/")[1];
          const { url } = response.data;

          setKey(extractedKey);

          const blobData = new Blob([binaryData], { type: file.type });

          await uploadBinaryFile(url, blobData, extractedKey, Token, file);
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      };

      reader.onerror = () => {
        console.error("Error reading file");
      };

      reader.readAsArrayBuffer(file);
    },
    [workspace]
  );

  // Function to upload binary file data using the presigned URL
  const uploadBinaryFile = async (
    presignedUrl: string,
    binaryData: any,
    extractedKey: string,
    token: string,
    file: File
  ) => {
    try {
      await axios.put(presignedUrl, binaryData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
          setUploadProgress(percentCompleted);
        },
      });

      await notifyFileUploadSuccess(extractedKey, token, file);
      setShowProgressBar(false);
      setUploadType(null);
      setUploadProgress(0);
      setCurrentUploadFileName('');
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // Function to notify API that file upload has completed
  const notifyFileUploadSuccess = async (
    extractedKey: string,
    token: string,
    file: File
  ) => {
    try {
      const payload = {
        clientExtension: file.name.split(".").pop(),
        clientMime: file.type,
        clientName: file.name,
        filename: extractedKey,
        size: file.size,
      };

      const response = await axios.post(
        "https://cms.candycloudy.com/api/v1/s3/entries",
        payload,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error notifying file upload success:", error);
    }
  };

  const { open } = useDropzone({
    onDrop,
  });

  const inputRef: any = useRef(null);

  const handleFolderSelect = async (event: any) => {
    const files = event.target.files;
    const token = getCookie("user");

    if (!token) {
      console.error("User token not found");
      return;
    }

    const filesArray = Array.from(files);
    setShowProgressBar(true);
    setUploadType('folder');
    setTotalFiles(filesArray.length);
    setUploadedFiles(0);
    setUploadProgress(0);

    const folderMap = new Map();

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];

      if (file.name.startsWith(".")) {
        continue;
      }

      setCurrentUploadFileName(file.name);

      const relativePath = file.webkitRelativePath;
      const pathParts = relativePath.split("/");

      let parentId = null;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];

        if (!folderMap.has(folderName)) {
          const folderResponse = await axios.post(
            "https://cms.candycloudy.com/api/v1/folders",
            { name: folderName, parentId },
            {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const folderId = folderResponse.data?.folder?.id;
          folderMap.set(folderName, folderId);
          parentId = folderId;
        } else {
          parentId = folderMap.get(folderName);
        }
      }

      const presignResponse = await axios.post(
        "https://cms.candycloudy.com/api/v1/s3/simple/presign",
        {},
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { key, url } = presignResponse.data;
      const blobData = new Blob([file], { type: file.type });

      await axios.put(url, blobData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            ((i + progressEvent.loaded / progressEvent.total) / totalFiles) * 100
          );
          setUploadProgress(percentCompleted);
        },
      });

      const payload = {
        clientExtension: file.name.split(".").pop(),
        clientMime: file.type,
        clientName: file.name,
        filename: key.split("/")[1],
        size: file.size,
        parentId,
      };

      await axios.post("https://cms.candycloudy.com/api/v1/s3/entries", payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setUploadedFiles((prev) => prev + 1);
      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    setShowProgressBar(false);
    setUploadType(null);
    setUploadedFiles(0);
    setTotalFiles(0);
    setCurrentUploadFileName('');
    setUploadProgress(0);
  };

  const uploadButtonItems: MenuProps["items"] = [
    {
      label: <Text>Upload File</Text>,
      key: "1",
      icon: <FileOutlined />,
      onClick: () => open(),
    },
    {
      label: (
        <div>
          <label htmlFor="folderInput">
            <span style={{ cursor: "pointer" }}>
              <FolderOutlined /> Upload Folder
            </span>
          </label>
          <input
            type="file"
            id="folderInput"
            ref={inputRef}
            multiple
            style={{ display: "none" }}
            onChange={handleFolderSelect}
            webkitdirectory="true"
            directory="true"
          />
        </div>
      ),
      key: "2",
    },
    {
      label: "Create new folder",
      key: "3",
      icon: <FolderAddOutlined />,
      onClick: () => setShowModal(true),
    },
  ];

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      alert("Please enter a folder name.");
      return;
    }

    try {
      const Token = getCookie("user");
      if (Token === null) {
        console.error("User token not found");
        return;
      }

      const response = await axios.post(
        "https://cms.candycloudy.com/api/v1/folders",
        { name: folderName },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${Token}`,
          },
        }
      );

      setShowModal(false);
      setFolderName("");
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  return (
    <div className="flex flex-col h-full px-6 overflow-y-scroll gap-9">
      <div className="flex cursor-pointer" onClick={() => navigate("/drive")}>
        <Image src={Logo} preview={false} width={130} />
      </div>

      <div className="flex items-center gap-4">
        <Image
          preview={false}
          src={`https://i.pravatar.cc/300/?img=12`}
          alt=""
          className="rounded-full !w-10"
        />
        <Dropdown menu={{ items: itemsmenu }} trigger={["click"]}>
          <div className="flex gap-1 p-3 text-xs leading-none cursor-pointer bg-primary-light text-primary-500 rounded-2xl">
            {isAdminLink ? "Admin" : "My Workspace"}
            <DownOutlined />
          </div>
        </Dropdown>
      </div>

      <Dropdown menu={{ items: uploadButtonItems }} trigger={["click"]}>
        <Button
          type="primary"
          style={{ padding: "10px 16px", height: "auto" }}
          icon={<PlusCircleOutlined />}
        >
          Create New
        </Button>
      </Dropdown>

      <SidebarFolders />

      <div className="flex flex-col gap-3">
        <Button
          type="link"
          className="p-0 flex items-center justify-start gap-2 text-sm font-medium text-[#888888]"
        >
          <ShareAltOutlined />
          <Text className="text-[#222E57]">Shared with me</Text>
        </Button>
        <Button
        onClick={() => navigate("/drive/recently")}
          type="link"
          className="p-0 flex items-center justify-start gap-2 text-sm font-medium text-[#888888]"
        >
          <ClockCircleFilled />
          <Text> Recently</Text>
        </Button>
        <Button
          onClick={() => navigate("/drive/starred")}
          type="link"
          className="p-0 flex items-center justify-start gap-2 text-sm font-medium text-[#888888]"
        >
          <StarFilled />
          <Text>Starred</Text>
        </Button>
        <Button
          type="link"
          className="p-0 z-50 flex items-center justify-start gap-2 text-sm font-medium text-[#888888]"
          onClick={() => navigate("/drive/trash")}
        >
          <DeleteFilled />
          <Text>Trash</Text>
        </Button>
      </div>

      {/* Fixed progress bar at the bottom right */}
      {showProgressBar && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            backgroundColor: 'white',
            padding: '15px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            width: '350px',
            zIndex: 1000,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {uploadType === 'file' && (
              <FileOutlined style={{ fontSize: '24px', marginRight: '10px' }} />
            )}
            {uploadType === 'folder' && (
              <FolderOutlined style={{ fontSize: '24px', marginRight: '10px' }} />
            )}
            <div style={{ flex: 1 }}>
              <Text strong>{currentUploadFileName}</Text>
              {uploadType === 'file' && (
                <Progress percent={uploadProgress} size="small" />
              )}
              {uploadType === 'folder' && (
                <div>
                  <Progress percent={uploadProgress} size="small" />
                  <Text>{uploadedFiles}/{totalFiles} files uploaded</Text>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* These elements are now always visible */}
      <div className="absolute top-0 left-0 w-28">
        <img src={TopMenuCurve} alt="Top Menu Curve" />
      </div>
      <div className="absolute bottom-0 left-0 w-28">
        <img src={BottomMenuCurve} alt="Bottom Menu Curve" />
      </div>
      <Modal
        title="Create New Folder"
        visible={showModal}
        onOk={handleCreateFolder}
        onCancel={() => setShowModal(false)}
      >
        <Input
          placeholder="Enter folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
        />
      </Modal>
    </div>
  );
}
const itemsmenu: MenuProps["items"] = [
  {
    label: <Link to="/drive">My workspace</Link>,
    key: "1",
  },
  {
    label: <Link to="admin">Admin</Link>,
    key: "2",
  },
];