import { Grid, Box } from '@mui/material';
import React from 'react';

function TableNoDataFoundMessage() {
    return (
        <Grid
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
            }}
        >
            No Data Found
        </Grid>
    );
}

function TableNotFound() {
    return (
        <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <TableNoDataFoundMessage />
        </Box>
    );
}

export default TableNotFound;
