import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import "./folder.css";
import { message } from "antd";
import folderIcon from "../../assets/icons/folder-icon.svg"; // Use your folder icon here

import { useFolderContext } from "../../context/FolderContext"; // Adjust the path as necessary
interface FolderNode {
  id: string | number;
  name: string;
  type: string;
  url?: string; // Include URL for files to preview/download
  parentId?: string | number; // Add parentId to track parent folder
  children?: FolderNode[]; // Optional, since not all folders might have children
}

const FolderDetails = () => {
  const location = useLocation();
  const { id, name, folder } = location.state || {};
  const { setCurrentFolderId } = useFolderContext();  // Corrected the function name here
  // const { folder } = location.state || {};
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<(string | number)[]>(
    []
  );

  useEffect(() => {
    if (id) {
      setCurrentFolderId(id);  // Use the corrected function name
    }
  }, [id, setCurrentFolderId]);

  useEffect(() => {
    const fetchFolders = async (parentId: string | number) => {
      const token = Cookies.get("user");
      try {
        const response = await fetch(
          `https://cms.candycloudy.com/api/v1/drive/file-entries?parentIds=${parentId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setFolders(data.data || []);
      } catch (error) {
        console.error("Error fetching folders:", error);
      }
    };
    fetchFolders(id);  // Updated to use the context-managed ID
  }, [id]);

  useEffect(() => {
    const fetchFiles = async () => {
      const token = Cookies.get("user");
      if (!setCurrentFolderId) return;
  
      try {
        const response = await fetch(`https://cms.candycloudy.com/api/v1/drive/files?folderId=${setCurrentFolderId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setFolders(data.files || []);  // Assuming 'files' is the key in response
      } catch (error) {
        console.error("Failed to fetch files:", error);
      }
    };
  
    fetchFiles();
  }, [setCurrentFolderId]);
  

  const toggleFolder = (folderId: string | number) => {
    setExpandedFolders((prevExpanded) =>
      prevExpanded.includes(folderId)
        ? prevExpanded.filter((id) => id !== folderId)
        : [...prevExpanded, folderId]
    );
  };

  const openFolder = (folderId: string | number) => {
    setCurrentFolderId(folderId.toString());
  };

  const handleAdd = async (parentId: string | number) => {
    const folderName = prompt("Enter folder name:");

    if (!folderName) return;

    const token = Cookies.get("user");

    try {
      const response = await fetch(
        `https://cms.candycloudy.com/api/v1/folders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            parentId: parentId,
            name: folderName,
            type: "folder",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedResponse = await response.json();
      setFolders((prevFolders) => [...prevFolders, updatedResponse.data]);
    } catch (error) {
      console.error("Error adding folder:", error);
    }
  };

  const handleTrash = async (folderId: string | number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item?"
    );

    if (!confirmDelete) return;

    const token = Cookies.get("user");

    try {
      const formData = new FormData();
      formData.append("soft", "true");

      const response = await fetch(
        `https://cms.candycloudy.com/api/files/${folderId}`,
        {
          method: "DELETE",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("File deleted successfully", result);
      message.success("File deleted successfully");

      // Update the state to remove the deleted file or folder
      setFolders((prevFolders) =>
        prevFolders.filter((folder) => folder.id !== folderId)
      );
    } catch (error) {
      console.error("Error deleting the file:", error);
    }
  };

  const renderFilePreview = (node: FolderNode) => {
    if (!node || !node.type || !node.name) return null;

    if (node.type === "image") {
      return (
        <div className="cardss">
          {node.url && (
            <img
              src={node.url}
              alt={node.name}
              className="card-image"
              onClick={() => window.open(node.url, "_blank")}
            />
          )}
          <p className="card-name">{node.name}</p>
          <button
            className="delete-button"
            onClick={() => handleTrash(node.id)}
          >
            Delete
          </button>
        </div>
      );
    } else if (node.url) {
      return (
        <div className="card">
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-link"
          >
            {node.name}
          </a>
          <button
            className="delete-button "
            onClick={() => handleTrash(node.id)}
          >
            Delete
          </button>
        </div>
      );
    } else {
      return (
        <div className="card">
          <p className="card-name">File not available</p>
          <button
            className="delete-button"
            onClick={() => handleTrash(node.id)}
          >
            Delete
          </button>
        </div>
      );
    }
  };

  const renderTree = (nodes: FolderNode[]) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <div className="folder-grid">
        {nodes.map((node, index) => {
          if (!node) return null;

          return (
            <div key={node.id || index} className="card">
              <div className="card-content">
                {node.type === "folder" ? (
                  <>
                    <span
                      onClick={() => openFolder(node.id)}
                      className="card-name"
                    >
                      {node.name}
                    </span>
                    <button
                      className="add-button hidden"
                      onClick={() => handleAdd(node.id)}
                    >
                      Add
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleTrash(node.id)}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  renderFilePreview(node)
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">Folders for Parent Folder: {name}</h1>
        
        {folders.length > 0 ? (
          // Assuming renderTree is defined elsewhere in your code to render the folder structure
          renderTree(folders)
        ) : (
          <p>No folders available for this folder.</p>
        )}
      </div>

      <div className="w-1/4 bg-gray-100 p-4">
        {folder ? (
          <div className="sticky top-0">
               <div className="flex gap-2">
               <img src={folderIcon} alt="Folder Icon" className="h-6 w-6" />
               <h3 className="text-lg font-semibold">Folder Properties</h3>
               </div>
            <p className="mt-10"><strong>Name:</strong> {folder.file_name}</p>
            <p className="mt-10"><strong>Type:</strong> Folder</p>
            <p className="mt-10"><strong>Owner:</strong> {folder.owner || "admin"}</p>
            <p className="mt-10"><strong>Created:</strong> {new Date(folder.created_at).toLocaleDateString()}</p>
            <p className="mt-10"><strong>Modified:</strong> {new Date(folder.updated_at).toLocaleDateString()}</p>
          </div>
        ) : (
          <p>No folder selected</p>
        )}
      </div>
    </div>
  );
};

export default FolderDetails;