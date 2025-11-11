import React, { useRef, useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";

const loginToken = localStorage.getItem("login_token");
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_ENDPOINT;
axios.defaults.headers.common = { Authorization: `Bearer ${loginToken}` };

const EditorComponent = ({ value = "", onChange, label, disabled = false }) => {
  const editorRef = useRef(null);
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    if (editorRef.current && isInit && value !== editorRef.current.getContent()) {
      let fixedValue = value.replace(/<img(?![^>]*display)/g, (match) => {
        return match + ' style="display:block;margin:10px auto;"';
      });
      editorRef.current.setContent(fixedValue || "");
    }
  }, [value, isInit]);

  useEffect(() => {
    if (editorRef.current && isInit) {
      const editor = editorRef.current;
      editor.mode.set(disabled ? "readonly" : "design");
      const container = editor.getContainer();
      const toolbar = container.querySelector(".tox-toolbar");
      const menubar = container.querySelector(".tox-menubar");
      if (toolbar) toolbar.style.display = disabled ? "none" : "flex";
      if (menubar) menubar.style.display = disabled ? "none" : "flex";
    }
  }, [disabled, isInit]);

  // ✅ Hàm upload ảnh
  const uploadImage = async (blobInfo) => {
    const formData = new FormData();
    formData.append("file", blobInfo.blob(), blobInfo.filename());
    const res = await axios.post("/api/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.location;
  };

  // ✅ Hàm upload file (media + tài liệu)
  const handleFileUpload = async (callback, value, meta) => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");

    // 🧩 Cho phép chọn loại file khác nhau
    if (meta.filetype === "image") {
      input.setAttribute("accept", "image/*");
    } else if (meta.filetype === "media") {
      input.setAttribute("accept", "video/*,audio/*");
    } else {
      input.setAttribute("accept", ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt");
    }

    input.onchange = async function () {
      const file = this.files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axios.post("/api/upload-file", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const fileUrl = res.data.location;

        // 🧠 TinyMCE cần gọi callback để chèn file vào nội dung
        if (meta.filetype === "image") {
          callback(fileUrl, { alt: file.name });
        } else if (meta.filetype === "media") {
          callback(fileUrl);
        } else {
          // Tài liệu → hiển thị link tải
          callback(fileUrl, { text: file.name });
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    };

    input.click();
  };

  return (
    <div className="my-4">
      {label && <label className="block text-gray-700 font-semibold mb-2">{label}</label>}

      <Editor
        apiKey="ke9gj1xsu2rumn53uqbyx6x81cvn0p8kwzr7t8cph6wfdxn4"
        onInit={(evt, editor) => {
          editorRef.current = editor;
          setIsInit(true);
          if (value) editor.setContent(value);

          if (disabled) {
            editor.mode.set("readonly");
            const container = editor.getContainer();
            const toolbar = container.querySelector(".tox-toolbar");
            const menubar = container.querySelector(".tox-menubar");
            if (toolbar) toolbar.style.display = "none";
            if (menubar) menubar.style.display = "none";
          }

          // ✅ Giữ vị trí cuộn khi thêm ảnh
          let lastScroll = 0;
          editor.on("BeforeSetContent", () => {
            const win = editor.getWin();
            lastScroll = win.scrollY || 0;
          });
          editor.on("SetContent", () => {
            requestAnimationFrame(() => {
              const win = editor.getWin();
              win.scrollTo(0, lastScroll);
            });
          });

          // ✅ Sửa lỗi phím cách
          editor.on("keydown", (e) => {
            if (e.key === " " && e.target === editor.getBody()) {
              e.preventDefault();
              editor.execCommand("mceInsertContent", false, " ");
            }
          });

          // ✅ Ép ảnh luôn hiển thị dạng block
          editor.on("NodeChange", () => {
            const imgs = editor.dom.select("img");
            imgs.forEach((img) => {
              if (editor.dom.getStyle(img, "display") !== "block") {
                editor.dom.setStyle(img, "display", "block");
                editor.dom.setStyle(img, "margin", "10px auto");
              }
            });
          });
        }}
        init={{
          height: 450,
          menubar: true,
          branding: false,
          paste_data_images: true,
          resize: true,
          images_upload_handler: uploadImage,
          file_picker_types: "image media file",
          file_picker_callback: handleFileUpload,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "media",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "table",
            "help",
            "wordcount",
          ],
          toolbar:
            "undo redo | blocks | bold italic forecolor | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | " +
            "image media link | removeformat | help",

          content_style: `
            body {
              font-family: Helvetica, Arial, sans-serif;
              font-size: 14px;
            }
            img {
              max-height: 400px;
              width: auto;
              height: auto;
              object-fit: contain;
              display: block;
              margin: 10px auto;
            }
            video, audio {
              display: block;
              margin: 10px auto;
              max-width: 100%;
            }
          `,
          readonly: disabled,
        }}
        onEditorChange={(content) => {
          if (isInit) onChange(content);
        }}
      />
    </div>
  );
};

export default EditorComponent;
