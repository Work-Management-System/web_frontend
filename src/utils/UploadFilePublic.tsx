import axios from 'axios';

export const uploadFilePublic = async (file: File) => {
    try {
        const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
        
        if (!baseURL) {
            throw new Error('NEXT_PUBLIC_API_BASE_URL is not set in environment variables');
        }
        
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(`${baseURL}/upload/public-file`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            timeout: 30000,
        });

        const uploadedFileUrl: string = response.data.data.url;
        return uploadedFileUrl;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};


