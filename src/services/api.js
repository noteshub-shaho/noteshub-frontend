import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  auth: {
    login: (data) => client.post("/api/auth/login", data),
    signup: (data) => client.post("/api/auth/register", data),
    logout: () => client.post("/api/auth/logout"),
    getGoogleAuthUrl: () => client.get("/api/auth/google/url"),
    sendResetOtp: (data) => client.post("/api/auth/forgot-password", data),
    verifyOtp: (email, otp) => client.post(`/api/auth/verify-otp/${email}`, { otp }),
    resetPassword: (email, data) => client.post(`/api/auth/change-password/${email}`, data),
    sendContact: (data) => client.post("/api/auth/contact", data),
  },

  notes: {
    getNotes: (university, semester, subject, subSubject) => {
      const path = subSubject
        ? `/api/notes/${university}/${semester}/${subject}/${subSubject}`
        : `/api/notes/${university}/${semester}/${subject}`;
      return client.get(path);
    },
    mergePdfs: (university, semester, subject, subSubject) => {
      const path = subSubject
        ? `/api/notes/merge/${university}/${semester}/${subject}/${subSubject}`
        : `/api/notes/merge/${university}/${semester}/${subject}`;
      return client.get(path, { responseType: "blob" });
    },
  },

  terms: {
    accept: () => client.post("/api/terms/accept-terms"),
  },

  donations: {
    createOrder: (amount) => client.post("/api/donations/create-order", { amount }),
    verifyPayment: (data) => client.post("/api/donations/verify", data),
  },

  admin: {
    upload: (formData) =>
      client.post("/api/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    listFolders: (path) =>
      client.get("/api/admin/folders", { params: { path } }),
    listCloudinaryFiles: (folder) =>
      client.get("/api/admin/cloudinary/files", { params: { folder } }),
    deleteCloudinaryFile: (public_id) =>
      client.delete("/api/admin/cloudinary/file", { data: { public_id } }),
    listSupabaseFiles: (folder) =>
      client.get("/api/admin/supabase/files", { params: { folder } }),
    deleteSupabaseFile: (path) =>
      client.delete("/api/admin/supabase/file", { data: { path } }),
    createCloudinaryFolder: (path) =>
      client.post("/api/admin/cloudinary/folder", { path }),
    renameCloudinaryFolder: (oldPath, newName) =>
      client.put("/api/admin/cloudinary/folder", { oldPath, newName }),
    deleteCloudinaryFolder: (path) =>
      client.delete("/api/admin/cloudinary/folder", { data: { path } }),
    createSupabaseFolder: (path) =>
      client.post("/api/admin/supabase/folder", { path }),
    renameSupabaseFolder: (oldPath, newName) =>
      client.put("/api/admin/supabase/folder", { oldPath, newName }),
    deleteSupabaseFolder: (path) =>
      client.delete("/api/admin/supabase/folder", { data: { path } }),
  },
};

export default client;