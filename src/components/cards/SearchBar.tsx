// SearchBar.tsx
import React from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

interface SearchBarProps {
  onSearch: (value: string) => void; // Add this line
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  return (
    <Input
      placeholder="Search here"
      allowClear
      size="large"
      className="min-w-[100px] flex-1 rounded-[20px] p-4 border-none outline-none"
      prefix={
        <button onClick={() => "Custom action"}>
          <SearchOutlined
            style={{ color: "#888888", marginInlineEnd: ".7rem" }}
          />
        </button>
      }
      onChange={(e) => onSearch(e.target.value)} // Use the onSearch prop here
    />
  );
};

export default SearchBar;
