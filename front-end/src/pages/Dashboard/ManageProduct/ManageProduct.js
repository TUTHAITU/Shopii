
import * as React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Products from './Products';
import AddProduct from './AddProduct'
import DeletedProductsLaydout from './DeletedProductsLaydout'
import { useOutletContext } from 'react-router-dom';

export default function ManageProduct() {
  const { handleSetDashboardTitle } = useOutletContext();
  handleSetDashboardTitle("Manage Product");
  return (
    <>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Products />
        </Paper>
      </Grid>
      <Grid item xs={12} sx={{
        position: 'fixed',
        bottom: 16,
        right: 30,
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
      }}>
        <AddProduct ></AddProduct>
        <DeletedProductsLaydout ></DeletedProductsLaydout>
      </Grid >

    </>
  );
}









