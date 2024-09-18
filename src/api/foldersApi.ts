import Cookies from "js-cookie";
import { Folders } from "../types/backend";
import axios from "axios";
function getFolders(setData: (data: any) => void) {
  // const url = `${import.meta.env.VITE_API_URL}/v1/users/91/folders`;
  const url = `${import.meta.env.VITE_API_URL}/v1/drive/file-entries`;
  const token = Cookies.get("user");
  axios
    .get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
    .then((res) => {
      // console.log(res);
      const folderData = res.data.data;
      setData(folderData);
    })
    .catch((err) => console.log(err));
}

// New function to create a folder
function createFolder(parentId: string, name: string) {
  const url = `${import.meta.env.VITE_API_URL}/v1/folders?name=${name}`;
  const token = Cookies.get("user");

  return axios.post(
    url,
    { parentId, name }, // Payload
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

const foldersApi = {
  getFolders,
  createFolder,
};
export default foldersApi;
