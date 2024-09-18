import { useMutation } from "@tanstack/react-query";
import { Flex, Form, Input, Modal, Typography } from "antd";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup/dist/yup";
import axios from "axios";
import Cookies from "js-cookie";

interface Inputs {
  name: string;
}

const RenameFileModal = ({
  open,
  onClose,
  fileId,
  apiUrl,
  refreshRecent,
}: {
  open: boolean;
  onClose: () => void;
  fileId: string;
  apiUrl: string;
  refreshRecent: () => void;
}) => {
  // Define the form validation schema using yup
  const {
    handleSubmit,
    control,
    formState: { errors },
    setError,
  } = useForm<Inputs>({
    resolver: yupResolver(
      yup.object({
        name: yup.string().required("Please enter a new name"), // Custom error message
      })
    ),
  });

  // Mutation for renaming the file
  const renameFileMutation = useMutation({
    mutationFn: (data: Inputs) => {
      const token = Cookies.get("user"); // Retrieve the authorization token

      // Make the API call to rename the file
      return axios.put(
        `${apiUrl}/v1/files/${fileId}`, // API URL with file ID
        null, // No body required
        {
          params: {
            name: data.name, // Pass the new file name in query parameters
          },
          headers: {
            Authorization: `Bearer ${token}`, // Include the authorization token
          },
        }
      );
    },
    onSuccess: () => {
      // Close the modal on success
      refreshRecent();
      onClose();
    },
    onError: (e: unknown) => {
      // Display error message if there's an error
      setError("name", { message: (e as Error).message });
    },
  });

  // Handle form submission
  const onSubmit = (data: Inputs) => {
    renameFileMutation.mutate(data);
  };

  return (
    <Modal
      title="Rename File"
      open={open}
      onOk={handleSubmit(onSubmit)} // Calls handleSubmit on OK
      onCancel={onClose}
      confirmLoading={renameFileMutation.isLoading} // Disable buttons when loading
    >
      <Form>
        <Flex
          style={{ marginTop: "1rem", flexDirection: "column" }}
          gap={"0.5rem"}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Enter a new name"
                defaultValue="" // Ensure the input field is clear
              />
            )}
          />
          {errors.name && (
            <Typography.Text type="danger" style={{ fontWeight: "400" }}>
              {errors.name.message}
            </Typography.Text>
          )}
        </Flex>
      </Form>
    </Modal>
  );
};

export default RenameFileModal;
