import createAxiosInstance from "@/app/axiosInstance";

export const uploadFile = async (file: File) => {
    try {
        const axiosInstance = createAxiosInstance();
        const formData = new FormData();
        formData.append("file", file);

        const response = await axiosInstance.post("upload/file", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        const uploadedFileUrl: string = response.data.data.url;
        return uploadedFileUrl;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

export const uploadMultipleFiles = async (files: File[]) => {
    try {
        const axiosInstance = createAxiosInstance();
        const formData = new FormData();

        files.forEach((file) => {
            formData.append("files", file);
        });

        const response = await axiosInstance.post("upload/multiple-file", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        const uploadedFileUrls: string[] = response.data.data.map((item: { url: string }) => item.url);
        return uploadedFileUrls;
    } catch (error) {
        console.error("Error uploading files:", error);
        throw error;
    }
};

