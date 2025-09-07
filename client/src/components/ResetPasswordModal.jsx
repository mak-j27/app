import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ResetPassword from './ResetPassword';

export default function ResetPasswordModal({ open, onClose }) {
  return (
    <Dialog className="dialog-animated" open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="modal-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Reset password</span>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <ResetPassword formId="reset-form" onClose={onClose} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="reset-form" variant="contained">Reset</Button>
      </DialogActions>
    </Dialog>
  );
}
