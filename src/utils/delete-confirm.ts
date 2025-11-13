// utils/deleteUtils.ts
import createAxiosInstance from '@/app/axiosInstance';
import Swal from 'sweetalert2';

interface DeleteConfig {
  title?: string;
  text?: string;
  confirmButtonText?: string;
  successTitle?: string;
  successText?: string;
  errorTitle?: string;
  errorText?: string;
  apiEndpoint: string;
  onSuccess?: () => Promise<void> | void;
}

const axiosInstance = createAxiosInstance();

const confirmAndDelete = async ({
  title = 'Are you sure?',
  text = 'This action cannot be undone!',
  confirmButtonText = 'Yes, delete it!',
  successTitle = 'Deleted!',
  successText = 'The item has been deleted.',
  errorTitle = 'Error',
  errorText = 'Failed to delete item',
  apiEndpoint,
  onSuccess,
}: DeleteConfig) => {
  const confirmResult = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText,
    width: '400px', // Set smaller width for confirmation dialog
  });

  if (confirmResult.isConfirmed) {
    try {
      await axiosInstance.delete(apiEndpoint);
      await Swal.fire({
        icon: 'success',
        title: successTitle,
        text: successText,
        timer: 1500,
        showConfirmButton: false,
        width: '400px',
         customClass: {
    // container: 'my-swal'
     popup: 'swal-custom-zindex',
    container: 'swal-container-zindex',
  }
      });
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: error.response?.data?.message || errorText,
        width: '400px', // Set smaller width for error dialog
      });
    }
  }
};

export default confirmAndDelete;