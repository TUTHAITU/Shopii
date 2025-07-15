import * as React from "react";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { Chip, Avatar } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import Link from "@mui/material/Link";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import AuthenService from "../../services/api/AuthenService";
import { resetUserInfo } from "../../redux/slices/orebi.slice";
import { useDispatch } from "react-redux";
import PeopleIcon from "@mui/icons-material/People"; // Manage Users
import WidgetsIcon from "@mui/icons-material/Widgets"; // Manage Products
import FeedbackIcon from "@mui/icons-material/Feedback"; // Manage Disputes
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong"; // Manage Orders
import Collapse from "@mui/material/Collapse";
import DashboardIcon from "@mui/icons-material/Dashboard"; // Dashboard Overview

import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="#!">
        SDN Company
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

const defaultTheme = createTheme();

export default function AdminDashboardLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dashboardTitle, setDashboardTitle] = React.useState("Admin Dashboard");
  const [open, setOpen] = React.useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };
  const [adminInfo, setAdminInfo] = useState(null); // Replace storeInfo with adminInfo

  useEffect(() => {
    // Fetch admin dashboard stats
    axios
      .get("http://localhost:9999/api/admin/report?skipAuth=true", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      })
      .then((res) => {
        if (res.data.success) {
          setAdminInfo({
            totalUsers: res.data.data.totalUsers,
            totalSellers: res.data.data.totalSellers,
            totalProducts: res.data.data.totalProducts,
            totalOrders: res.data.data.totalOrders,
            summary: `Users: ${res.data.data.totalUsers}, Sellers: ${res.data.data.totalSellers}`,
          });
        } else {
          setAdminInfo(null);
        }
      })
      .catch(() => setAdminInfo(null));
  }, []);

  const [openAdminMgmt, setOpenAdminMgmt] = React.useState(false);
  const handleToggleAdminMgmt = () => {
    setOpenAdminMgmt((prev) => !prev);
  };

  const handleSetDashboardTitle = (newDashboardTitle) => {
    setDashboardTitle(newDashboardTitle);
  };

  const handleOnclickOverview = () => {
    navigate("/admin");
  };
  const handleOnclickUsers = () => {
    navigate("/admin/manage-users");
  };
  const handleOnclickStores = () => {
    navigate("/admin/manage-stores");
  };
  const handleOnclickProducts = () => {
    navigate("/admin/manage-products");
  };

  const handleOnclickSignout = async () => {
    await AuthenService.logout();
    dispatch(resetUserInfo());
    navigate("/signin");
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: "24px",
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: "36px",
                ...(open && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              {dashboardTitle}
            </Typography>
            {adminInfo ? (
              <Chip
                avatar={
                  <Avatar
                    src={adminInfo.avatarURL || undefined} // Adjust based on your admin data structure
                    alt={adminInfo.fullname || "Admin"}
                  />
                }
                label={adminInfo.fullname || "Admin"}
                color="info"
                sx={{ ml: 2, fontWeight: 600, fontSize: 16 }}
              />
            ) : (
              <Chip
                avatar={<Avatar />}
                label="Loading..."
                color="info"
                sx={{ ml: 2 }}
              />
            )}
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List component="nav">
            <React.Fragment>
              <ListItemButton onClick={handleOnclickOverview}>
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard Overview" />
              </ListItemButton>
              <ListItemButton onClick={handleToggleAdminMgmt}>
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="Admin Management" />
              </ListItemButton>
              <Collapse in={openAdminMgmt} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton sx={{ pl: 4 }} onClick={handleOnclickUsers}>
                    <ListItemIcon>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText primary="Manage Users" />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }} onClick={handleOnclickStores}>
                    <ListItemIcon>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText primary="Manage Shop" />
                  </ListItemButton>
                </List>
              </Collapse>
              <ListItemButton onClick={handleOnclickProducts}>
                <ListItemIcon>
                  <WidgetsIcon />
                </ListItemIcon>
                <ListItemText primary="Manage Products" />
              </ListItemButton>
            </React.Fragment>
            <Divider sx={{ my: 1 }} />
            <React.Fragment>
              <ListSubheader component="div" inset></ListSubheader>
              <ListItemButton onClick={handleOnclickSignout}>
                <ListItemIcon>
                  <MeetingRoomIcon />
                </ListItemIcon>
                <ListItemText primary="Signout" />
              </ListItemButton>
            </React.Fragment>
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Outlet context={{ handleSetDashboardTitle }} />
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
