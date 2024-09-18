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
  // console.log("workspace => 1",workspace)

  // Helper function to get token from cookies
  const getCookie = (cookieName: string) => {
    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    // console.log(decodedCookie);
    // const cookieArray = decodedCookie.split(";");
    // for (let i = 0; i < cookieArray.length; i++) {
    //   let cookie = cookieArray[i];
    //   while (cookie.charAt(0) === " ") {
    //     cookie = cookie.substring(1);
    //   }
    //   if (cookie.indexOf(name) === 0) {
    //     return cookie.substring(name.length, cookie.length);
    //   }
    // }
    // return null;
    const cookieString = decodeURIComponent(document.cookie);

    // Split the cookie string and find the relevant cookie
    const cookie = cookieString
      .split(";")
      .find((cookie) => cookie.trim().startsWith(name));

    // Return the part after the '=' (cookie value), or null if not found
    return cookie ? cookie.split("=")[1].trim() : null;
  };
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const Token = getCookie("user");

      if (Token === null) {
        console.error("User token not found");
        return; // Exit early if the token is null
      }
      setToken(Token);

      // Convert the file to binary (ArrayBuffer)
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const binaryData = reader.result; // Binary data as ArrayBuffer

          if (!binaryData) {
            console.error("Failed to read binary data");
            return;
          }

          // console.log("Binary Data: ", binaryData);

          // console.log("Fetching presigned URL...");
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

          // console.log(response);

          // Extract the key and URL from the API response
          const extractedKey = response.data.key.split("/")[1];
          const { url } = response.data;

          setKey(extractedKey);
          // console.log("Presigned URL:", url);

          // Convert the ArrayBuffer into a Blob
          const blobData = new Blob([binaryData], { type: file.type });

          // Pass the binary data (Blob) to the upload function
          await uploadBinaryFile(url, blobData, extractedKey, Token, file); // Pass key, token, and file for the next step
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      };

      reader.onerror = () => {
        console.error("Error reading file");
      };

      // Read the file as an ArrayBuffer
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
      // Perform the PUT request with the binary file data (Blob)
      const uploadResponse = await axios.put(presignedUrl, binaryData);

      // console.log("File uploaded successfully:", uploadResponse.data);

      // Call the next function if upload is successful
      await notifyFileUploadSuccess(extractedKey, token, file);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };
  // const [recent, setRecent] = useState<any[]>([]);
  // Function to notify API that file upload has completed
  const notifyFileUploadSuccess = async (
    extractedKey: string,
    token: string,
    file: File
  ) => {
    try {
      const payload = {
        clientExtension: file.name.split(".").pop(), // Get the file extension
        clientMime: file.type, // File mime type
        clientName: file.name, // Original filename
        filename: extractedKey, // The key returned from the presigned URL API
        size: file.size, // File size in bytes
      };

      // console.log("Notifying file upload success with data: ", payload);

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
      // fetchDataRecentView(setRecent);
      // console.log("File upload notification response:", response.data);
    } catch (error) {
      console.error("Error notifying file upload success:", error);
    }
  };

  const { open } = useDropzone({
    onDrop,
  });

  const inputRef: any = useRef(null);

  const handleFolderSelect = (event: any) => {
    const files = event.target.files;
    // console.log("Selected files:", files);
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
            <button onClick={() => inputRef.current.click()}>
              Upload Folder
            </button>
          </label>
          <input
            type="file"
            id="folderInput"
            ref={inputRef}
            multiple
            style={{ display: "none" }}
            onChange={handleFolderSelect}
            onClick={() =>
              inputRef.current.setAttribute("webkitdirectory", "true")
            }
          />
        </div>
      ),
      key: "2",
      icon: <FolderOutlined />,
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

      // console.log("Folder created successfully:", response.data);
      setShowModal(false); // Close the modal
      setFolderName(""); // Clear the folder name input
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  return (
    <div className="flex flex-col h-full px-6 overflow-y-scroll gap-9">
      <div className="flex cursor-pointer" onClick={() => navigate("/drive")}>
        <Image src={Logo} preview={false} width={130} />
      </div>
      {/* <div className="hidden">
        {recent.map((items, index) => (
          <CardWithMenu
            key={index}
            item={{
              id: items.id,
              name: items.mime,
              file_size: items.file_size,
              link: items.url,
              type: items.type,
            }}
          />
        ))}
      </div> */}
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
