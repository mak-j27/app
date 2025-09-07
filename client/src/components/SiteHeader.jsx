import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import EnvBadge from "./EnvBadge";

export default function SiteHeader() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <Box className="site-header-outer" sx={{ width: "100%" }}>
      <AppBar
        position="static"
        color="primary"
        sx={{ boxShadow: 3 }}
        className="site-header"
      >
        <Container maxWidth="lg" sx={{ px: 2 }}>
          <Toolbar
            sx={{ display: "flex", gap: 2, minHeight: 64 }}
            disableGutters
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
              }}
              onClick={() => navigate("/")}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
                className="site-header-logo"
              >
                MyApp
              </Typography>
              <EnvBadge />
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Desktop actions */}
            <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
              <Button
                color="inherit"
                onClick={() => navigate("/login")}
                sx={{ textTransform: "none" }}
              >
                Sign in
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate("/register")}
                sx={{ textTransform: "none" }}
              >
                Register
              </Button>
            </Box>

            {/* Mobile menu button */}
            <Box sx={{ display: { xs: "flex", sm: "none" } }}>
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                aria-label="open menu"
              >
                <MenuIcon />
              </IconButton>
              <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate("/login");
                  }}
                >
                  Sign in
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate("/register");
                  }}
                >
                  Register
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  );
}
