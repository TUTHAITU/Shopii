import * as React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Products from './Products';
import AddProduct from './AddProduct';
// import DeletedProductsLaydout from './DeletedProductsLaydout';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';

export default function ManageProduct() {
  const { handleSetDashboardTitle } = useOutletContext();
  const [products, setProducts] = React.useState([]);

  // Set the dashboard title
  handleSetDashboardTitle("Manage Product");

  // Fetch products after adding a new one or updating
  const updateProductList = () => {
    axios.get("http://localhost:9999/api/seller/products?skipAuth=true")
      .then((res) => setProducts(res.data.data))
      .catch((error) => console.error("Error fetching product list:", error));
  };

  React.useEffect(() => {
    // Initial fetch of products
    updateProductList();
  }, []);

  return (
    <>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Products products={products} onProductUpdated={updateProductList} />
        </Paper>
      </Grid>
      <Grid
        item
        xs={12}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 30,
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
        }}
      >
        <AddProduct onAdded={updateProductList} />
        {/* <DeletedProductsLaydout /> */}
      </Grid>
    </>
  );
}
// import * as React from 'react';
// import Grid from '@mui/material/Grid';
// import Paper from '@mui/material/Paper';
// import Products from './Products';
// import AddProduct from './AddProduct'
// import DeletedProductsLaydout from './DeletedProductsLaydout'
// import { useOutletContext } from 'react-router-dom';

// export default function ManageProduct() {
//   const { handleSetDashboardTitle } = useOutletContext();
//   handleSetDashboardTitle("Manage Product");
//   return (
//     <>
//       <Grid item xs={12}>
//         <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
//           <Products />
//         </Paper>
//       </Grid>
//       <Grid item xs={12} sx={{
//         position: 'fixed',
//         bottom: 16,
//         right: 30,
//         display: 'flex',
//         flexDirection: 'row',
//         gap: 1,
//       }}>
//         <AddProduct ></AddProduct>
//         <DeletedProductsLaydout ></DeletedProductsLaydout>
//       </Grid >

//     </>
//   );
// }
// import * as React from 'react';
// import Grid from '@mui/material/Grid';
// import Paper from '@mui/material/Paper';
// import Products from './Products';
// import AddProduct from './AddProduct';
// import DeletedProductsLaydout from './DeletedProductsLaydout';
// import { useOutletContext } from 'react-router-dom';
// import axios from 'axios';

// export default function ManageProduct() {
//   const { handleSetDashboardTitle } = useOutletContext();
//   const [products, setProducts] = React.useState([]);

//   // Set the dashboard title
//   handleSetDashboardTitle("Manage Product");

//   // Fetch products after adding a new one
//   const updateProductList = () => {
//     // Fetch the updated product list from the backend
//     axios.get("http://localhost:9999/api/seller/products?skipAuth=true")
//       .then((res) => setProducts(res.data.data))
//       .catch((error) => console.error("Error fetching product list:", error));
//   };

//   React.useEffect(() => {
//     // Initial fetch of products
//     updateProductList();
//   }, []);

//   return (
//     <>
//       <Grid item xs={12}>
//         <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
//           <Products products={products} />
//         </Paper>
//       </Grid>
//       <Grid
//         item
//         xs={12}
//         sx={{
//           position: 'fixed',
//           bottom: 16,
//           right: 30,
//           display: 'flex',
//           flexDirection: 'row',
//           gap: 1,
//         }}
//       >
//         {/* Pass the updateProductList function to AddProduct */}
//         <AddProduct onAdded={updateProductList} />
//         <DeletedProductsLaydout />
//       </Grid>
//     </>
//   );
// }








