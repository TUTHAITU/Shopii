import * as React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function Notification({ handleShowNotification, showNotification, contentNotification, severity }) {
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        handleShowNotification(false);
    };

    return (
        <div>

            <Snackbar open={showNotification} autoHideDuration={6000} onClose={handleClose}>
                <Alert
                    onClose={handleClose}
                    severity={severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                    anchororigin={{
                        vertical: 'bottom', horizontal: 'right'
                    }}
                >
                    {contentNotification}
                </Alert>
            </Snackbar>
        </div>
    );
}
