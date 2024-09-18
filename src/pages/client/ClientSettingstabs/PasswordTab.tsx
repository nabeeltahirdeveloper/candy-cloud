import SettingHeader from "../../../components/SettingHeader";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup/dist/yup";
import { Button, Flex, Input, message } from "antd";
import InputWrapper from "../../../components/UI/InputWrapper";
import axios from "axios"; // To send the form data to your backend

interface Inputs {
  old_password: string;
  new_password: string;
  new_password_confirmation: string;
}

const PasswordTab = () => {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: yupResolver(
      yup.object({
        old_password: yup.string().required("Old password is required"),
        new_password: yup.string().required("New password is required"),
        new_password_confirmation: yup
          .string()
          .oneOf([yup.ref("new_password")], "Passwords must match")
          .required("Confirm password is required"),
      })
    ),
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
      formData.append("old_password", data.old_password);
      formData.append("new_password", data.new_password);
      formData.append(
        "new_password_confirmation",
        data.new_password_confirmation
      );

      const response = await axios.post(
        "https://cms.candycloudy.com/api/v1/user_settings/password",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${Token}`,
          },
        }
      );

      if (response.status === 200) {
        message.success("Password updated successfully!");
      } else {
        message.error("Failed to update password.");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      message.error("An error occurred while updating the password.");
    }
  };

  return (
    <>
      <SettingHeader title="Manage Passwords" />
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
        <Flex
          style={{ marginTop: "1rem", flexDirection: "column" }}
          gap={"0.5rem"}
        >
          <Controller
            name="old_password"
            control={control}
            render={({ field }) => (
              <InputWrapper title={"Current Password"}>
                <Input.Password
                  {...field}
                  placeholder="Enter old password"
                  className="rounded-2xl border-none py-3 px-3"
                />
                {errors.old_password && (
                  <p style={{ color: "red" }}>{errors.old_password.message}</p>
                )}
              </InputWrapper>
            )}
          />

          <Controller
            name="new_password"
            control={control}
            render={({ field }) => (
              <InputWrapper title={"New Password"}>
                <Input.Password
                  {...field}
                  placeholder="Enter new password"
                  className="rounded-2xl border-none py-3 px-3"
                />
                {errors.new_password && (
                  <p style={{ color: "red" }}>{errors.new_password.message}</p>
                )}
              </InputWrapper>
            )}
          />

          <Controller
            name="new_password_confirmation"
            control={control}
            render={({ field }) => (
              <InputWrapper title={"Confirm New Password"}>
                <Input.Password
                  {...field}
                  placeholder="Confirm new password"
                  className="rounded-2xl border-none py-3 px-3"
                />
                {errors.new_password_confirmation && (
                  <p style={{ color: "red" }}>
                    {errors.new_password_confirmation.message}
                  </p>
                )}
              </InputWrapper>
            )}
          />

          <Flex
            gap={12}
            justify="end"
            className="w-full max-md:flex-col-reverse "
          >
            <Button
              htmlType="submit"
              type="primary"
              className="max-md:w-full h-fit py-2 px-4"
            >
              Update Password
            </Button>
          </Flex>
        </Flex>
      </form>
    </>
  );
};

export default PasswordTab;
