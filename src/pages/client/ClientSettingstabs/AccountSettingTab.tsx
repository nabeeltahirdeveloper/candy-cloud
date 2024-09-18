import React, { useEffect, useState } from "react";
import SettingHeader from "../../../components/SettingHeader";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup/dist/yup";
import {
  Avatar,
  Button,
  Flex,
  Input,
  Select,
  Spin,
  Upload,
  UploadProps,
  Image,
  message,
  Form,
} from "antd";
import InputWrapper from "../../../components/UI/InputWrapper";
import { LoadingOutlined, UserOutlined } from "@ant-design/icons";
import { UploadFile } from "antd/lib/upload/interface";
import axios from "axios"; // To make HTTP requests

interface Inputs {
  username: string;
  email: string;
  preffered_language: number;
}

const ImageComponent: React.FC<{ file: UploadFile }> = ({ file }) => {
  if (!file) {
    return null; // Or return a placeholder element
  }

  // Handle the case when the file is still uploading
  if (file.status === "uploading") {
    return (
      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
    );
  }

  // Handle the case when the file is a URL (already uploaded)
  const imageUrl =
    file.url || (file.originFileObj && URL.createObjectURL(file.originFileObj));

  return (
    <div className="w-16 h-16 rounded-full overflow-hidden">
      <Image
        src={imageUrl}
        alt={file.name}
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
};

const AccountSettingTab = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const onChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const { handleSubmit, control, reset } = useForm<Inputs>({
    resolver: yupResolver(
      yup.object({
        username: yup.string().required().label("Username"),
        email: yup.string().email().required().label("Email"),
        preffered_language: yup.number().required().label("Preferred language"),
      })
    ),
    defaultValues: {
      username: "",
      email: "",
      preffered_language: 1,
    },
  });

  const getCookie = (cookieName: string) => {
    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);

    const cookie = decodedCookie
      .split(";")
      .find((cookie) => cookie.trim().startsWith(name));

    return cookie ? cookie.split("=")[1].trim() : null;
  };

  const onSubmit = async (data: Inputs) => {
    try {
      const Token = getCookie("user");

      if (Token === null) {
        console.error("User token not found");
        return;
      }

      const formData = new FormData();

      // Append the form fields
      formData.append("username", data.username);
      formData.append("email", data.email);
      formData.append("preffered_language", String(data.preffered_language)); // Convert number to string

      // Append the file if it exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("avatar", fileList[0].originFileObj);
      }

      // Send data to the backend
      const response = await axios.post(
        "https://cms.candycloudy.com/api/v1/user_settings",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${Token}`,
          },
        }
      );

      if (response.status === 200) {
        message.success("Profile updated successfully!");
        reset(); // Optionally reset the form
      }
    } catch (error) {
      console.error("Error updating profile: ", error);
      message.error("Failed to update profile.");
    }
  };

  // Function to fetch user details and set the form values
  const fetchUserDetails = async () => {
    const token = getCookie("user");

    // console.log(token);
    if (!token) {
      message.error("User token not found");
      return;
    }

    try {
      const response = await axios.get(
        "https://cms.candycloudy.com/api/v1/user_settings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // console.log(response.data);
      if (response.status === 200 && response.data) {
        const { username, email, preffered_language, avatar } =
          response.data.pagination.details;

        // Update form fields with the fetched data
        reset({
          username: username || "",
          email: email || "",
          preffered_language: preffered_language || 1,
        });

        // Update the avatar if there's a profile image
        if (avatar) {
          setFileList([
            {
              uid: "-1",
              name: "avatar",
              status: "done",
              url: avatar, // Use the avatar URL directly
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching user details: ", error);
      message.error("Failed to fetch user details.");
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  return (
    <div className="">
      <SettingHeader title="Profile" />
      <Form
        layout="vertical"
        onFinish={handleSubmit(onSubmit)} // Adjusted to directly call handleSubmit
      >
        <Flex
          style={{ marginTop: "1rem", flexDirection: "column" }}
          gap={"0.5rem"}
        >
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <InputWrapper title={"Username"}>
                <Input
                  {...field}
                  placeholder="Enter username"
                  className=" rounded-2xl border-none py-3 px-3"
                />
              </InputWrapper>
            )}
          />
          <InputWrapper
            title={"Your photo"}
            titleDesc="This will be displayed on your profile."
          >
            <div className="w-full ">
              <Flex gap={4} align="center">
                {fileList[0] ? (
                  <ImageComponent file={fileList[0]} />
                ) : (
                  <Avatar src="" size={64} icon={<UserOutlined />} />
                )}
                {fileList[0] && (
                  <Button
                    onClick={() => setFileList([])}
                    type="text"
                    className="ms-2"
                  >
                    Delete
                  </Button>
                )}
                <Upload
                  maxCount={1}
                  showUploadList={false}
                  onChange={onChange}
                  beforeUpload={() => false} // Disable automatic upload
                >
                  <Button
                    type="link"
                    className="ms-2 text-[#0154A0] font-semibold"
                  >
                    {fileList[0] ? "Update" : "Upload"}
                  </Button>
                </Upload>
              </Flex>
            </div>
          </InputWrapper>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <InputWrapper title={"Email Address"}>
                <Input
                  {...field}
                  placeholder="Enter email address"
                  className=" rounded-2xl border-none py-3 px-3"
                />
              </InputWrapper>
            )}
          />

          <Controller
            name="preffered_language"
            control={control}
            render={({ field }) => (
              <InputWrapper title={"Preferred language"}>
                <Flex className="w-full">
                  <Select
                    {...field}
                    className="flex-1 h-auto w-full  [&>.ant-select-selector]:!border-none [&>.ant-select-selector]:!px-3 [&>.ant-select-selector]:!py-3       "
                    options={[
                      { value: 1, label: "en" },
                      { value: 2, label: "fr" },
                    ]}
                  ></Select>
                </Flex>
              </InputWrapper>
            )}
          />

          <Flex
            gap={12}
            justify="end"
            className="w-full max-md:flex-col-reverse "
          >
            <Button
              className="max-md:w-full h-fit py-2 px-4"
              onClick={() => {
                reset();
              }}
            >
              {" "}
              Cancel
            </Button>
            <Button
              htmlType="submit"
              type="primary"
              className="max-md:w-full h-fit py-2 px-4"
            >
              {" "}
              Save
            </Button>
          </Flex>
        </Flex>
      </Form>
    </div>
  );
};

export default AccountSettingTab;
