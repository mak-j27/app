import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPassword from '../ResetPassword';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

describe('ResetPassword component', () => {
  const mockResp = {
    ok: true,
    status: 200,
    headers: new Map(),
    clone: () => ({ json: async () => ({ message: 'Password reset' }), text: async () => 'Password reset' }),
    json: async () => ({ message: 'Password reset' }),
    text: async () => 'Password reset'
  };

  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve(mockResp));
  });
  afterEach(() => {
    delete global.fetch;
  });

  test('submits new password and shows success', async () => {
    // The component may read token from URL; provide search params via route
    const token = 'abc123';
    const email = 'user@example.com';
    render(
      <MemoryRouter initialEntries={[`/reset?email=${encodeURIComponent(email)}&token=${token}`]}>
        <Routes>
          <Route path="/reset" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );

    const pwd = screen.getByLabelText(/new password/i);
    await userEvent.type(pwd, 'StrongPass!23');

    // Button text is 'Reset Password'
    const submit = screen.getByRole('button', { name: /reset password/i });
    await userEvent.click(submit);

    await waitFor(() => expect(screen.queryByText(/password reset/i)).toBeTruthy());
  });
});
