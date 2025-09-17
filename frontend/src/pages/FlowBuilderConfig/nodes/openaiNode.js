import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
} from "@mui/icons-material";
import React, { memo } from "react";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Handle } from "react-flow-renderer";
import { SiOpenai } from "react-icons/si";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "8px",
        borderRadius: "8px",
        boxShadow: "rgba(0, 0, 0, 0.05) 0px 3px 5px",
        border: "1px solid rgba(52, 152, 219, 0.25)",
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "#3498db",
          width: "18px",
          height: "18px",
          top: "20px",
          left: "-12px",
          cursor: "pointer",
        }}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "#ffff",
            width: "10px",
            height: "10px",
            marginLeft: "2.9px",
            marginBottom: "1px",
            pointerEvents: "none",
          }}
        />
      </Handle>
      
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 5,
          top: 5,
          cursor: "pointer",
          gap: 6,
        }}
      >
        <ContentCopy
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("duplicate");
          }}
          sx={{ width: "12px", height: "12px", color: "#F7953B" }}
        />

        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: "12px", height: "12px", color: "#F7953B" }}
        />
      </div>
      
      <div
        style={{
          color: "#ededed",
          fontSize: "16px",
          flexDirection: "row",
          display: "flex",
        }}
      >
        <SiOpenai
          style={{
            width: "16px",
            height: "16px",
            marginRight: "4px",
            marginTop: "4px",
            color: "#3498db"
          }}
        />
        <div style={{ color: "#232323", fontSize: "16px" }}>OpenAI</div>
      </div>
      
      <div style={{ color: "#232323", fontSize: "12px", width: 180 }}>
        <div
          style={{
            backgroundColor: "#E8F4FD",
            marginBottom: "3px",
            borderRadius: "5px",
          }}
        >
          <div style={{ gap: "5px", padding: "6px" }}>
            <div style={{ textAlign: "center" }}>GPT AI Assistant</div>
          </div>
        </div>
      </div>
      
      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "#3498db",
          width: "18px",
          height: "18px",
          top: "70%",
          right: "-11px",
          cursor: "pointer",
        }}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "#ffff",
            width: "10px",
            height: "10px",
            marginLeft: "2.9px",
            marginBottom: "1px",
            pointerEvents: "none",
          }}
        />
      </Handle>
    </div>
  );
});