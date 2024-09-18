import {
  Button,
  DatePicker,
  Divider,
  Flex,
  Form,
  Input,
  Modal,
  Switch,
  Typography,
} from "antd";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // Import js-cookie for token
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
const { Text } = Typography;

interface Inputs {
  is_expiring: number;
  expire_date: string;
  is_password_protected: number;
  password: string;
  allow_download: number;
}

const LinkSettingModal = ({
  open,
  onClose,
  fileId,
  fetchShareableLink, // New function to fetch the shareable link
}: {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fetchShareableLink: () => void; // Function passed to call the API
}) => {
  const { handleSubmit, control, watch } = useForm<Inputs>({
    resolver: yupResolver(yup.object({})),
  });

  const [linkData, setLinkData] = useState<any>(null); // Store the link data
  const isExpiring = watch("is_expiring");
  const isPasswordProtected = watch("is_password_protected");

  // Fetch the current shareable link when the modal is opened
  useEffect(() => {
    if (open) {
      fetchShareableLink();
    }
  }, [open]);

  // The API submission function
  const onSubmit = async (data: Inputs) => {
    const token = Cookies.get("user");

    const payload: any = {
      allowDownload: data.allow_download === 1,
    };

    if (data.is_expiring === 1 && data.expire_date) {
      payload.expires_at = new Date(data.expire_date).toISOString();
    }

    if (data.is_password_protected === 1 && data.password) {
      payload.password = data.password;
    }

    try {
      const response = await axios.post(
        `https://cms.candycloudy.com/api/v1/file-entries/${fileId}/shareable-link`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Success:", response.data);
      onClose(); // Close the modal after success
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <Modal
      title={<div>Shareable Link Settings</div>}
      open={open}
      onOk={handleSubmit(onSubmit)} // Trigger form submission on "OK"
      onCancel={onClose}
      confirmLoading={false}
    >
      <Divider></Divider>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Flex
          style={{ marginTop: "1rem", flexDirection: "column" }}
          gap={"0.5rem"}
        >
          <Controller
            name="is_expiring"
            control={control}
            render={({ field }) => (
              <Flex className="flex-col mt-4" gap={"0.75rem"}>
                <Text style={{ fontWeight: "500", color: "#222E57" }}>
                  Link expiration
                </Text>
                <Flex align="center" className="w-full justify-between">
                  <Flex gap={"0.5rem"} align="center">
                    <Switch
                      checked={field.value === 1}
                      onChange={(e) => field.onChange(e ? 1 : 0)}
                    />
                    <Text className="text-xs text-[#333333]">
                      Link is valid until
                    </Text>
                  </Flex>
                </Flex>
                {!!isExpiring && (
                  <Flex gap={"0.5rem"}>
                    <Controller
                      name="expire_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          {...field}
                          className="bg-[#EAEBF0] rounded-2xl border-none py-3 px-3 w-full"
                        />
                      )}
                    />
                  </Flex>
                )}
              </Flex>
            )}
          />
        </Flex>

        <Flex style={{ flexDirection: "column" }}>
          <Divider className="my-4"></Divider>
          <Controller
            name="is_password_protected"
            control={control}
            render={({ field }) => (
              <Flex className="flex-col " gap={"0.75rem"}>
                <Text style={{ fontWeight: "500", color: "#222E57" }}>
                  Password protect
                </Text>
                <Flex align="center" className="w-full justify-between">
                  <Flex gap={"0.5rem"} align="center">
                    <Switch
                      checked={field.value === 1}
                      onChange={(e) => field.onChange(e ? 1 : 0)}
                    />
                    <Text className="text-xs text-[#333333]">
                      Users will need to enter password in order to view this
                      link
                    </Text>
                  </Flex>
                </Flex>
                {!!isPasswordProtected && (
                  <Flex gap={"0.5rem"}>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <Input.Password
                          {...field}
                          className="bg-[#EAEBF0] rounded-2xl border-none py-3 px-3"
                        />
                      )}
                    />
                  </Flex>
                )}
              </Flex>
            )}
          />
        </Flex>

        <Flex style={{ flexDirection: "column" }}>
          <Divider className="my-4"></Divider>
          <Controller
            name="allow_download"
            control={control}
            render={({ field }) => (
              <Flex className="flex-col " gap={"0.75rem"}>
                <Text style={{ fontWeight: "500", color: "#222E57" }}>
                  Allow download
                </Text>
                <Flex align="center" className="w-full justify-between">
                  <Flex gap={"0.5rem"} align="center">
                    <Switch
                      checked={field.value === 1}
                      onChange={(e) => field.onChange(e ? 1 : 0)}
                    />
                    <Text className="text-xs text-[#333333]">
                      Users with link can download this item
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            )}
          />
        </Flex>
        <Button hidden type="primary" htmlType="submit" />
      </Form>
    </Modal>
  );
};

export default LinkSettingModal;
