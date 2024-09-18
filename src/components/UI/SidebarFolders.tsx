import React, { useEffect, useState } from "react";
import { Menu, MenuProps, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { FolderIcon } from "../../icons/icons";
import { getFilesApi } from "../../api/amt/files/getFilesApi";
import Papa from "papaparse"; // Import PapaParse for CSV parsing
import FileViewer from "react-file-viewer";

export interface Root {
  id: number;
  name: string;
  description: string;
  file_name: string;
  mime: any;
  file_size: number;
  user_id: any;
  parent_id: any;
  created_at: string;
  updated_at: string;
  deleted_at: any;
  path: string;
  disk_prefix: any;
  type: string;
  extension: any;
  public: boolean;
  thumbnail: boolean;
  workspace_id: number;
  owner_id: number;
  hash: string;
  url: any;
  users: User[];
  tags: any[];
  permissions: any[];
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function SidebarFolders() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const navigate = useNavigate();
  const [data, setData] = useState<Root[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [csvData, setCsvData] = useState<string[][] | null>(null);

  useEffect(() => {
    getFilesApi(setData);
  }, []);

  // Generate menu items
  useEffect(() => {
    const arr: MenuItem[] = [];
    if (data.length > 0) {
      data.forEach((item) => {
        if (item.parent_id && arr.length !== 0) {
          const targetedItem = findItemByKey(arr, String(item.parent_id));
          if (targetedItem && isSubMenu(targetedItem)) {
            targetedItem.children = [
              ...(targetedItem.children || []),
              {
                key: String(item.id),
                label: item.name,
                hash: item.hash,
                icon: <FolderIcon />,
              } as MenuItem,
            ];
          }
        } else {
          arr.push({
            key: String(item.id),
            label: item.name,
            hash: item.hash,
            icon: <FolderIcon />,
          } as MenuItem);
        }
      });
    }

    setMenuItems([
      {
        key: "0",
        label: "My Files",
        children: arr,
      } as MenuItem,
    ]);
  }, [data]);

  const handleMenuClick = (e: any) => {
    const item: any = menuItems[0];
    if (isSubMenu(item)) {
      const foundItem = findItemByKey(item.children, e.key);
      if (foundItem?.hash) {
        const selectedFileItem = data.find(
          (file) => file.hash === foundItem.hash
        );
        if (selectedFileItem) {
          setSelectedFile(null);
          setTimeout(() => {
            setSelectedFile(selectedFileItem.url);
            setFileType(selectedFileItem.extension);
            setIsModalVisible(true);

            if (selectedFileItem.extension === "csv") {
              fetchCsvData(selectedFileItem.url);
            }
          }, 100);
        }
      }
    }
  };

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

  return (
    <div className="leading-none">
      <Menu
        style={{ borderInlineEnd: "none" }}
        mode="inline"
        onClick={handleMenuClick}
        items={menuItems}
      />

      {/* Modal to display file preview */}
      <Modal
        title="File Preview"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width="80%"
        key={selectedFile}
      >
        {selectedFile ? (
          <>
            {fileType === "jpg" || fileType === "png" || fileType === "jpeg" ? (
              <img
                src={`https://cms.candycloudy.com/${encodeURIComponent(
                  selectedFile
                )}`}
                alt="Preview"
                style={{ width: "100%", height: "auto" }}
              />
            ) : fileType === "csv" ? (
              renderCsvTable()
            ) : fileType === "pdf" ? (
              <>
                {/* Using embed to view the PDF */}
                <embed
                  src={`https://cms.candycloudy.com/${encodeURIComponent(
                    selectedFile
                  )}`}
                  type="application/pdf"
                  style={{ width: "100%", height: "750px" }}
                  // frameBorder="0"
                />
              </>
            ) : (
              <FileViewer
                fileType={fileType || ""}
                filePath={`https://cms.candycloudy.com/${encodeURIComponent(
                  selectedFile
                )}`}
              />
            )}
          </>
        ) : (
          <p>No file selected</p>
        )}
      </Modal>
    </div>
  );
}

type MenuItem = Required<MenuProps>["items"][number];

function isSubMenu(item: any): item is any & { children: any[] } {
  return "children" in item;
}

function findItemByKey(items: any[], key: string): any | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.key === key) {
      return item;
    }
    if (isSubMenu(item)) {
      const foundInChildren = findItemByKey(item.children, key);
      if (foundInChildren) {
        return foundInChildren;
      }
    }
  }
  return null;
}
