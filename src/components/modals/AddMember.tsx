import { CloseCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Tag, Tooltip, Typography } from "antd";
import React, { ChangeEvent, useState } from "react";
import { postShareWithEmail } from "../../api/amt/files/postShareWithEmail";
import { useEffect} from "react";
import axios from "axios";

const { Text } = Typography;

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  handleOk: (values: { emails: string[] }) => void;
  addIsLoading: boolean;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  open,
  onClose,
  handleOk,
  addIsLoading,
}) => {
  const [form] = Form.useForm();
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [inputError, setInputError] = useState<string>("");
  interface User {
    id: string;
    email: string;
  }
  
  const [searchResults, setSearchResults] = useState<User[]>([]);

  const handleInputChange = (e: { target: { value: any; }; }) => {
    const input = e.target.value;
    setInputValue(input);
    if (input) {
        fetchUserSuggestions(input);  // Call the API only if there is input
    } else {
        setSearchResults([]);  // Clear results if input is empty
    }
};

const fetchUserSuggestions = async (input: string) => {
  if (!input.trim()) return setSearchResults([]);  // Return if input is only whitespace
  try {
    const response = await axios.get(`https://cms.candycloudy.com/api/handleUsers?page=1&query=${encodeURIComponent(input)}`);
    if (response.data && Array.isArray(response.data.data)) {
      // Filter users whose email starts with the input text
      const matchedUsers = response.data.data.filter((user: { email: string; }) => 
        user.email.toLowerCase().startsWith(input.toLowerCase())
      );
      setSearchResults(matchedUsers);
      console.log("Filtered users:", matchedUsers);
    } else {
      setSearchResults([]);
      console.log("No users found or incorrect data structure:", response.data);
    }
  } catch (error) {
    console.error("Failed to fetch users:", error);
    setSearchResults([]);
  }
};




const handleEmailClick = (email: React.SetStateAction<string>) => {
  setInputValue(email);  // Set the clicked email into the input field
  setSearchResults([]);  // Optionally clear the search results after selection
};


  
  // add any thing to access posh
  const validateEmail = (email: string): boolean => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleInputConfirm = () => {
    if (inputValue && validateEmail(inputValue)) {
      if (!emails.includes(inputValue)) {
        setEmails([...emails, inputValue]);
        setInputValue("");
        setInputError("");
      } else {
        setInputError("This email address has already been added.");
      }
    } else {
      setInputError("Please enter a valid email address.");
    }
  };

  const handleClose = (removedEmail: string) => {
    setEmails(emails.filter((email) => email !== removedEmail));
  };

  const handleFormSubmit = () => {
    form.validateFields().then(() => {
      handleOk({ emails });
      form.resetFields();
      setEmails([]);
    });

    postShareWithEmail(emails)
  };

  // console.log(emails);


  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "12px",
          }}
        >
          <PlusCircleOutlined
            style={{ color: "#52c41a", fontSize: "1.25rem" }}
          />
          <Text
            style={{ fontSize: "1.25rem", color: "#52c41a", fontWeight: 500 }}
          >
            Add Member
          </Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      confirmLoading={addIsLoading}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="add-email" type="primary" onClick={handleInputConfirm}>
          Add Email
        </Button>,

        <Button
          key="invite"
          type="primary"
          loading={addIsLoading}
          onClick={handleFormSubmit}
        >
          Invite
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
      <Form.Item label="Invite" validateStatus={inputError ? "error" : ""} help={inputError}>
  <Input
    value={inputValue}
    onChange={handleInputChange}
    onPressEnter={handleInputConfirm}
    placeholder="Enter email addresses"
    suffix={
      inputError && (
        <Tooltip title={inputError} color="red">
          <CloseCircleOutlined style={{ color: "red" }} />
        </Tooltip>
      )
    }
  />
<div style={{ marginTop: "10px" }}>
  {searchResults.map((user) => (
    <div key={user.id} style={{ padding: "5px", border: "1px solid #ddd", margin: "5px 0", cursor: "pointer" }} onClick={() => handleEmailClick(user.email)}>
      {user.email}
    </div>
  ))}
</div>


</Form.Item>

        <Form.Item>
          <div>
            {emails.map((email) => (
              <Tag
                key={email}
                closable
                onClose={() => handleClose(email)}
                style={{
                  marginBottom: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {email}
              </Tag>
            ))}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddMemberModal;
