import * as React from 'react';
import { Autocomplete, TextField, Grid, Button, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, MenuItem, Snackbar, Alert, Fab, Tooltip, Zoom } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import { styled } from '@mui/material/styles';
import axios from 'axios'; // For making API requests

// Define VisuallyHiddenInput for file upload
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function AddProduct({ onAdded }) {
  const [openAddProductDialog, setOpenAddProductDialog] = React.useState(false);
  const [openAddCategoryDialog, setOpenAddCategoryDialog] = React.useState(false);  // New state for Add Category Dialog
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [price, setPrice] = React.useState(0);
  const [isAuction, setIsAuction] = React.useState('false');
  // const [auctionEndTime, setAuctionEndTime] = React.useState('');
  const [quantity, setQuantity] = React.useState(0);
  const [image, setImage] = React.useState('');
  const [snackbar, setSnackbar] = React.useState({ open: false, msg: '', severity: 'success' });
  const [categories, setCategories] = React.useState([]);

  const [newCategoryName, setNewCategoryName] = React.useState('');  // For category name input
  const [newCategoryDescription, setNewCategoryDescription] = React.useState('');  // For category description input

  // Fetch categories
  React.useEffect(() => {
    axios.get('http://localhost:9999/api/seller/categories?skipAuth=true')
      .then(res => setCategories(res.data.data))
      .catch(() => setCategories([]));
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();

    const requestBody = {
      title,
      description,
      price,
      isAuction: isAuction === 'true',
      categoryId,
      quantity,
      image: typeof image === 'string' ? image : '',
    };

    // if (isAuction === 'true' && auctionEndTime) {
    //   requestBody.auctionEndTime = auctionEndTime;
    // }

    try {
      const result = await axios.post('http://localhost:9999/api/seller/products?skipAuth=true', requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (result.data?.success) {
        setSnackbar({ open: true, msg: 'Product added successfully!', severity: 'success' });
        setOpenAddProductDialog(false);
        setTitle('');
        setDescription('');
        setCategoryId('');
        setPrice(0);
        setIsAuction('false');
        // setAuctionEndTime('');
        setQuantity(0);
        setImage('');
        onAdded();
      } else {
        setSnackbar({ open: true, msg: result.data.message, severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, msg: 'Error occurred while adding the product.', severity: 'error' });
    }
  };
  
  const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(URL.createObjectURL(file));
        }
    };
  const handleAddCategoryClick = () => {
    setOpenAddCategoryDialog(true); // Opens the category creation dialog
  };

  const handleAddCategory = async () => {
    const requestBody = {
      name: newCategoryName,
      description: newCategoryDescription,
    };

    try {
      const result = await axios.post('http://localhost:9999/api/seller/categories?skipAuth=true', requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (result.data?.success) {
        setSnackbar({ open: true, msg: 'Category added successfully!', severity: 'success' });
        setOpenAddCategoryDialog(false);
        setNewCategoryName('');
        setNewCategoryDescription('');
        setCategories(prev => [...prev, result.data.data]);
      } else {
        setSnackbar({ open: true, msg: result.data.message, severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, msg: 'Error occurred while adding the category.', severity: 'error' });
    }
  };

  return (
    <>
      <Tooltip title="Add new product">
        <Zoom in={true}>
          <Fab aria-label="Add" color="primary" onClick={() => setOpenAddProductDialog(true)}>
            <AddIcon />
          </Fab>
        </Zoom>
      </Tooltip>

      <Dialog open={openAddProductDialog} onClose={() => setOpenAddProductDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To add new products to the store, please fill out the information below and submit a request.
          </DialogContentText>

          <form onSubmit={handleAddProduct}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Product Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6} container spacing={2} alignItems="center">
                <Grid item xs={10}>
                  <Autocomplete
                    options={categories}
                    getOptionLabel={(option) => option.name}
                   value={categories.find(category => category._id === categoryId) || null}
                    onChange={(e, newValue) => setCategoryId(newValue ? newValue._id : '')}
                    renderInput={(params) => <TextField {...params} label="Category" />}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={2}>
                  <Tooltip title="Add new category">
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleAddCategoryClick}
                      fullWidth
                    >
                      +
                    </Button>
                  </Tooltip>
                </Grid>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Is Auction"
                  value={isAuction}
                  onChange={(e) => setIsAuction(e.target.value)}
                  fullWidth
                  required
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </TextField>
              </Grid>

              {/* {isAuction === 'true' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Auction End Time"
                    type="datetime-local"
                    value={auctionEndTime}
                    onChange={(e) => setAuctionEndTime(e.target.value)}
                    required
                  />
                </Grid>
              )} */}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Image URL"
                  value={image || ''}
                  onChange={(e) => setImage(e.target.value)} // For URL input
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                  Upload Image
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleImageChange}// For file upload
                  />
                </Button>
              </Grid>
            </Grid>

            <DialogActions>
              <Button onClick={() => setOpenAddProductDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                Add Product
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openAddCategoryDialog} onClose={() => setOpenAddCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Category Description"
            value={newCategoryDescription}
            onChange={(e) => setNewCategoryDescription(e.target.value)}
            required
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
          <DialogActions>
            <Button onClick={() => setOpenAddCategoryDialog(false)} color="secondary">Cancel</Button>
            <Button onClick={handleAddCategory} variant="contained" color="primary">Add Category</Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
      </Snackbar>
    </>
  );
}
// import * as React from 'react';
// import Dialog from '@mui/material/Dialog';
// import DialogActions from '@mui/material/DialogActions';
// import DialogContent from '@mui/material/DialogContent';
// import DialogTitle from '@mui/material/DialogTitle';
// import TextField from '@mui/material/TextField';
// import MenuItem from '@mui/material/MenuItem';
// import Button from '@mui/material/Button';
// import CloudUploadIcon from '@mui/icons-material/CloudUpload';
// import { styled } from '@mui/material/styles';
// import Grid from '@mui/material/Grid';
// import axios from 'axios'; // For making API requests
// import Snackbar from '@mui/material/Snackbar';
// import Alert from '@mui/material/Alert';
// import { Autocomplete, DialogContentText, Fab, Tooltip, Zoom } from '@mui/material';
// import AddIcon from '@mui/icons-material/Add';
// import Title from '../Title';

// const VisuallyHiddenInput = styled('input')({
//   clip: 'rect(0 0 0 0)',
//   clipPath: 'inset(50%)',
//   height: 1,
//   overflow: 'hidden',
//   position: 'absolute',
//   bottom: 0,
//   left: 0,
//   whiteSpace: 'nowrap',
//   width: 1,
// });

// export default function AddProduct({ onAdded }) {
//   const [openAddProductDialog, setOpenAddProductDialog] = React.useState(false);
//   const [openAddCategoryDialog, setOpenAddCategoryDialog] = React.useState(false);

//   // Form state data
//   const [title, setTitle] = React.useState('');
//   const [description, setDescription] = React.useState('');
//   const [categoryId, setCategoryId] = React.useState('');
//   const [price, setPrice] = React.useState(0);
//   const [isAuction, setIsAuction] = React.useState('false');
//   const [auctionEndTime, setAuctionEndTime] = React.useState('');
//   const [quantity, setQuantity] = React.useState(0);
//   const [image, setImage] = React.useState('');

//   // New Category Data
//   const [newCategoryName, setNewCategoryName] = React.useState('');
//   const [newCategoryDescription, setNewCategoryDescription] = React.useState('');

//   // Notification handling
//   const [snackbar, setSnackbar] = React.useState({ open: false, msg: '', severity: 'success' });

//   const [categories, setCategories] = React.useState([]);

//   // Fetch categories
//   React.useEffect(() => {
//     axios.get('http://localhost:9999/api/seller/categories?skipAuth=true')
//       .then(res => setCategories(res.data.data))
//       .catch(() => setCategories([]));
//   }, []);

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setImage(URL.createObjectURL(file));
//     }
//   };

//   const handleAddCategory = async () => {
//     const requestBody = {
//       name: newCategoryName,
//       description: newCategoryDescription
//     };
//     try {
//       const result = await axios.post('http://localhost:9999/api/seller/categories?skipAuth=true', requestBody, {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });
//       if (result.data?.success) {
//         setSnackbar({ open: true, msg: 'Category added successfully!', severity: 'success' });
//         setOpenAddCategoryDialog(false);
//         setNewCategoryName('');
//         setNewCategoryDescription('');
//         setCategories(prev => [...prev, result.data.data]);
//       } else {
//         setSnackbar({ open: true, msg: result.data.message, severity: 'error' });
//       }
//     } catch (error) {
//       setSnackbar({ open: true, msg: 'Error occurred while adding the category.', severity: 'error' });
//     }
//   };

//   const handleAddProduct = async (e) => {
//     e.preventDefault();

//     const requestBody = {
//       title,
//       description,
//       price,
//       isAuction: isAuction === 'true',
//       categoryId,
//       quantity,
//       image: typeof image === 'string' ? image : '',
//     };

//     if (isAuction === 'true' && auctionEndTime) {
//       requestBody.auctionEndTime = auctionEndTime;
//     }

//     try {
//       const result = await axios.post('http://localhost:9999/api/seller/products?skipAuth=true', requestBody, {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (result.data?.success) {
//         setSnackbar({ open: true, msg: 'Product added successfully!', severity: 'success' });
//         setOpenAddProductDialog(false);
//         setTitle('');
//         setDescription('');
//         setCategoryId('');
//         setPrice(0);
//         setIsAuction('false');
//         setAuctionEndTime('');
//         setQuantity(0);
//         setImage('');
//         onAdded();
//       } else {
//         setSnackbar({ open: true, msg: result.data.message, severity: 'error' });
//       }
//     } catch (error) {
//       setSnackbar({ open: true, msg: 'Error occurred while adding the product.', severity: 'error' });
//     }
//   };

//   const handleCategoryChange = (e) => {
//     const selectedCategory = e.target.value;
//     if (selectedCategory === 'addNewCategory') {
//       setOpenAddCategoryDialog(true);
//     } else {
//       setCategoryId(selectedCategory);
//     }
//   };

//   return (
//     <>
//       <Tooltip title="Add new product">
//         <Zoom in={true}>
//           <Fab aria-label="Add" color="primary" onClick={() => setOpenAddProductDialog(true)}>
//             <AddIcon />
//           </Fab>
//         </Zoom>
//       </Tooltip>

//       <Dialog open={openAddProductDialog} onClose={() => setOpenAddProductDialog(false)} maxWidth="md" fullWidth>
//         <DialogTitle>Add New Product</DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             To add new products to the store, please fill out the information below and submit a request.
//           </DialogContentText>

//           <form onSubmit={handleAddProduct}>
//             <Grid container spacing={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="Product Title"
//                   value={title}
//                   onChange={(e) => setTitle(e.target.value)}
//                   required
//                 />
//               </Grid>

//               {/* <Grid item xs={12} sm={6}>
//                 <TextField
//                   select
//                   label="Category"
//                   value={categoryId}
//                   onChange={handleCategoryChange}
//                   fullWidth
//                   required
//                 >
//                   {categories.map((category) => (
//                     <MenuItem key={category._id} value={category._id}>
//                       {category.name}
//                     </MenuItem>
//                   ))}
//                   <MenuItem value="addNewCategory" sx={{ display: 'flex', justifyContent: 'center' }}>
//                     +
//                   </MenuItem>

//                 </TextField>
//                   <Autocomplete
//                   options={categories}
//                   getOptionLabel={(option) => option.name}
//                   value={categoryId}
//                   onChange={(e, newValue) => setCategoryId(newValue ? newValue._id : '')}
//                   renderInput={(params) => <TextField {...params} label="Category" />}
//                   fullWidth
//                   required
//                 />
//               </Grid> */}
//                <Grid item xs={12} sm={6} container spacing={2} alignItems="center">
//                 <Grid item xs={10}>
//                   <Autocomplete
//                     options={categories}
//                     getOptionLabel={(option) => option.name}
//                     value={categoryId}
//                     onChange={(e, newValue) => setCategoryId(newValue ? newValue._id : '')}
//                     renderInput={(params) => <TextField {...params} label="Category" />}
//                     fullWidth
//                     required
//                   />
//                 </Grid>
//                 <Grid item xs={2}>
//                   <Tooltip title="Add new category">
//                     <Button
//                       variant="outlined"
//                       color="primary"
//                       onClick={handleAddCategoryClick}
//                       fullWidth
//                     >
//                       +
//                     </Button>
//                   </Tooltip>
//                 </Grid>
//               </Grid>


//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   fullWidth
//                   label="Price"
//                   type="number"
//                   value={price}
//                   onChange={(e) => setPrice(e.target.value)}
//                   required
//                 />
//               </Grid>

//               <Grid item xs={12} sm={6}>
//                 <TextField
//                   select
//                   label="Is Auction"
//                   value={isAuction}
//                   onChange={(e) => setIsAuction(e.target.value)}
//                   fullWidth
//                   required
//                 >
//                   <MenuItem value="true">Yes</MenuItem>
//                   <MenuItem value="false">No</MenuItem>
//                 </TextField>
//               </Grid>

//               {isAuction === 'true' && (
//                 <Grid item xs={12}>
//                   <TextField
//                     fullWidth
//                     label="Auction End Time"
//                     type="datetime-local"
//                     value={auctionEndTime}
//                     onChange={(e) => setAuctionEndTime(e.target.value)}
//                     required
//                   />
//                 </Grid>
//               )}

//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   label="Description"
//                   multiline
//                   rows={3}
//                   value={description}
//                   onChange={(e) => setDescription(e.target.value)}
//                   required
//                 />
//               </Grid>

//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   label="Quantity"
//                   type="number"
//                   value={quantity}
//                   onChange={(e) => setQuantity(e.target.value)}
//                   required
//                 />
//               </Grid>

//               <Grid item xs={12} sm={8}>
//                 <TextField
//                   fullWidth
//                   label="Image URL"
//                   value={image || ''}
//                   onChange={(e) => setImage(e.target.value)} // For URL input
//                 />
//               </Grid>

//               <Grid item xs={12} sm={4}>
//                 <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
//                   Upload Image
//                   <VisuallyHiddenInput
//                     type="file"
//                     accept="image/png, image/jpeg"
//                     onChange={handleImageChange} // For file upload
//                   />
//                 </Button>
//               </Grid>
//             </Grid>

//             <DialogActions>
//               <Button onClick={() => setOpenAddProductDialog(false)}>Cancel</Button>
//               <Button type="submit" variant="contained" color="primary">
//                 Add Product
//               </Button>
//             </DialogActions>
//           </form>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={openAddCategoryDialog} onClose={() => setOpenAddCategoryDialog(false)} maxWidth="sm" fullWidth>
//         <Title sx={{ textAlign: 'center', fontWeight: 700, fontSize: 22 }}>Add New Category</Title>
//         <DialogContent >
//           <TextField
//             fullWidth
//             label="Category Name"
//             value={newCategoryName}
//             onChange={(e) => setNewCategoryName(e.target.value)}
//             required
//           />

//           <TextField
//             fullWidth
//             label="Description"
//             multiline
//             rows={3}
//             value={newCategoryDescription}
//             onChange={(e) => setNewCategoryDescription(e.target.value)}
//             required
//             sx={{ mt: 2 }}
//           />
//           <DialogActions>
//             <Button onClick={() => setOpenAddCategoryDialog(false)} color="secondary">Cancel</Button>
//             <Button onClick={handleAddCategory} variant="contained" color="primary">Add Category</Button>
//           </DialogActions>
//         </DialogContent>
//       </Dialog>

//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={2500}
//         onClose={() => setSnackbar((s) => ({ ...s, open: false }))}

//         anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
//       >
//         <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
//       </Snackbar>
//     </>
//   );
// }

