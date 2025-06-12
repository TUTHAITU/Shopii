import * as React from 'react';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from '../Title';
import ProductService from '../../../services/api/ProductService'
import SpecsDialog from './SpecsDialog';
import InStockDialog from './InStockDialog';
import DescDialog from './DescDialog'
// Generate Order Data

function preventDefault(event) {
  event.preventDefault();
}

export default function Products() {
  const [products, setProducts] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      setProducts(await ProductService.getAllProducts());
    })();
  }, [])

  return (
    <React.Fragment>
      <Title>Products</Title>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Brand</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Available</TableCell>
            <TableCell>Desc</TableCell>
            <TableCell>In stock</TableCell>
            <TableCell>Specs</TableCell>
            <TableCell>Cost</TableCell>
            <TableCell align="right">Price</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products && products.map((product, index) => (
            <TableRow style={{ cursor: 'pointer' }}>
              <TableCell>
                <React.Fragment>
                  {product?.name}
                </React.Fragment>
              </TableCell>
              <TableCell>
                <React.Fragment>
                  {product?.brand}
                </React.Fragment>
              </TableCell>
              <TableCell>
                <React.Fragment>
                  {product?.category}
                </React.Fragment>
              </TableCell>
              <TableCell>
                <React.Fragment>
                  {product?.isAvailable.toString()}
                </React.Fragment>
              </TableCell>

              <TableCell >
                <React.Fragment>
                  <DescDialog description={product.description}></DescDialog>
                </React.Fragment>
              </TableCell>
              <TableCell >
                <React.Fragment>
                  <SpecsDialog specs={product.specs}></SpecsDialog>
                </React.Fragment>
              </TableCell>
              <TableCell >
                <React.Fragment>
                  <InStockDialog inStock={product.inStock}></InStockDialog>
                </React.Fragment>
              </TableCell>
              <TableCell>
                <React.Fragment>
                  {`$${product?.cost}`}
                </React.Fragment>
              </TableCell>
              <TableCell align="right">
                <React.Fragment>
                  {`$${product?.price}`}
                </React.Fragment>
              </TableCell>
            </TableRow>

          ))}
        </TableBody>
      </Table>
      <Link color="primary" href="#" onClick={preventDefault} sx={{ mt: 3 }}>
        See more Products
      </Link>
    </React.Fragment>
  );
}
