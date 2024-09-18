/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import axios from "axios";
import { addUser } from "../store/slices/userSlice";
import Cookies from "js-cookie";

export const fetchDataLogin = (
  dataLogin: { email: string; password: string },
  navigate: any,
  dispatch: any
) => {
  const url = `${import.meta.env.VITE_API_URL}/v1/auth/login`;

  axios
    .post(
      url,
      { ...dataLogin },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    )
    .then((res) => {
      const token = res.data.token;
      // console.log(res);
      const cook = Cookies.set("user", token);
      navigate("/drive");
    })
    .catch((err) => console.log("Error fetching data"));
};
