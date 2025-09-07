import React from 'react';
import { Box, Container, Link as MuiLink } from '@mui/material';

export default function SiteFooter() {
  return (
    <Box component="div" className="site-footer-outer" sx={{ width: '100%' }}>
      <Box component="footer" className="site-footer" sx={{ py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
            © {new Date().getFullYear()} MyApp. All rights reserved.
          </Box>
          <Box>
            <MuiLink href="/terms" color="inherit" underline="none" sx={{ mr: 2 }}>Terms</MuiLink>
            <MuiLink href="/privacy" color="inherit" underline="none">Privacy</MuiLink>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
