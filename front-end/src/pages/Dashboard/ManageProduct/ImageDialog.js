import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Tooltip from '@mui/material/Tooltip';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ProductService from '../../../services/api/ProductService'

export default function ImageDialog({ images }) {

    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <React.Fragment>
            <Tooltip title="View Images">
                <VisibilityOutlinedIcon fontSize='small' color="info" onClick={() => handleClickOpen()}></VisibilityOutlinedIcon>
            </Tooltip>
            <Dialog
                open={open}
                onClose={handleClose}
            >
                <DialogTitle></DialogTitle>
                <DialogContent>
                    <React.Fragment>
                        <ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={164}>
                            {images && images?.map((item, index) => (
                                <ImageListItem key={index}>
                                    <img
                                        srcSet={`${ProductService.getImage(item.filename)}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                                        src={`${ProductService.getImage(item.filename)}?w=164&h=164&fit=crop&auto=format`}
                                        loading="lazy"
                                        alt="Product"
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                    </React.Fragment>
                </DialogContent>
                <DialogActions>
                    <CancelIcon color="primary" style={{ cursor: 'pointer' }} onClick={handleClose}>X</CancelIcon>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
