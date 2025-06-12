import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { styled } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import CancelIcon from '@mui/icons-material/Cancel';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';

export default function InStockDialog({ inStock }) {
    const StyledTableCell = styled(TableCell)(({ theme }) => ({
        [`&.${tableCellClasses.head}`]: {
            backgroundColor: theme.palette.common.black,
            color: theme.palette.common.white,
        },
        [`&.${tableCellClasses.body}`]: {
            fontSize: 14,
        },
    }));

    const StyledTableRow = styled(TableRow)(({ theme }) => ({
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.action.hover,
        },
        // hide last border
        '&:last-child td, &:last-child th': {
            border: 0,
        },
    }));

    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };


    return (
        <React.Fragment>
            <Tooltip title="View detail">
                <VisibilityOutlinedIcon fontSize='small' color="info" onClick={() => handleClickOpen()}></VisibilityOutlinedIcon>
            </Tooltip>
            <Dialog
                open={open}
                onClose={handleClose}
            >
                <DialogTitle>In Stock</DialogTitle>
                <DialogContent>
                    <React.Fragment>
                        <TableContainer component={Paper}>
                            <Table aria-label="customized table">
                                <TableHead>
                                    <TableRow>
                                        <StyledTableCell>Color</StyledTableCell>
                                        <StyledTableCell align="right">Quantity</StyledTableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {inStock.map((item) => (
                                        <StyledTableRow key={item.color}>
                                            <StyledTableCell component="th" scope="row">
                                                {item.color}
                                            </StyledTableCell>
                                            <StyledTableCell align="right">{item.quantity}</StyledTableCell>
                                        </StyledTableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </React.Fragment>
                </DialogContent>
                <DialogActions>
                    <CancelIcon color="primary" style={{ cursor: 'pointer' }} onClick={handleClose}></CancelIcon>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
