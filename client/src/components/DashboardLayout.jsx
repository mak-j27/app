import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Button,
  Box,
  Container,
} from "@mui/material";
import PropTypes from "prop-types";

const DashboardLayout = ({
  user,
  tab,
  onTabChange,
  children,
  onLogout,
  titlePrefix,
  extraTabs = [],
  fullWidthChildren = false,
}) => {
  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: "primary.main",
          color: "common.white",
          boxShadow: 3,
        }}
      >
        <Toolbar sx={{ alignItems: "center", minHeight: 64 }}>
          <Typography
            variant="h6"
            sx={{ mr: 3, fontWeight: 600 }}
            color="inherit"
          >
            {titlePrefix} {user?.firstName}
          </Typography>

          <Tabs
            value={tab}
            onChange={onTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ "& .MuiTab-root": { color: "common.white" } }}
          >
            <Tab label="Home" />
            <Tab label="Profile" />
            {extraTabs.map((t) => (
              <Tab key={t} label={t} />
            ))}
          </Tabs>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            color="inherit"
            onClick={onLogout}
            sx={{ textTransform: "none" }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Spacer to push content below the fixed AppBar */}
      <Toolbar />

      {fullWidthChildren ? (
        <Box sx={{ width: "100%", mt: 2 }}>{children}</Box>
      ) : (
        <Container maxWidth="lg">
          <Box sx={{ mt: 2 }}>{children}</Box>
        </Container>
      )}

  {/* Footer removed - using global SiteFooter for consistency */}
    </>
  );
};

DashboardLayout.propTypes = {
  user: PropTypes.object,
  tab: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
  children: PropTypes.node,
  onLogout: PropTypes.func.isRequired,
  titlePrefix: PropTypes.string,
};

DashboardLayout.defaultProps = {
  titlePrefix: "Welcome,",
};

DashboardLayout.propTypes.extraTabs = PropTypes.array;
DashboardLayout.defaultProps.extraTabs = [];
// new prop: render children full width (no container)
DashboardLayout.propTypes.fullWidthChildren = PropTypes.bool;
DashboardLayout.defaultProps.fullWidthChildren = false;

export default DashboardLayout;
