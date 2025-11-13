import { Box, Pagination, PaginationItem } from '@mui/material';
import ArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';

export const CustomPagination = ({
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
}: {
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void;
}) => {
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  return (
    <Box display="flex" justifyContent="center" py={3}>
      <Pagination
        page={page}
        count={totalPages}
        onChange={onPageChange}
        variant="outlined"
        shape="rounded"
        renderItem={(item) => (
          <PaginationItem
            slots={{ previous: ArrowLeftIcon, next: ArrowRightIcon }}
            {...item}
            sx={{
              mx: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'var(--primary-color-1)',
                color: 'white',
                fontWeight: 'bold',
              },
              border: '1px solid var(--primary-color-1)',
              color: 'var(--primary-color-1)',
              fontWeight: 'bold',
              borderRadius: '50%',
              minWidth: 36,
              height: 36,
              '&:hover': {
                backgroundColor: 'var(--primary-color-1)',
                color: 'white',
              },
            }}
          />
        )}
      />
    </Box>
  );
};
