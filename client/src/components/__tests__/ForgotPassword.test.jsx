import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPassword from '../ForgotPassword';
import { MemoryRouter } from 'react-router-dom';

describe('ForgotPassword component', () => {
  const mockResp = {
    ok: true,
    status: 200,
    headers: new Map(),
    clone: () => ({ json: async () => ({ message: 'Reset link sent' }), text: async () => 'Reset link sent' }),
    json: async () => ({ message: 'Reset link sent' }),
    text: async () => 'Reset link sent'
  };

  beforeEach(() => {
    // If fetch isn't defined in this environment, assign a jest.fn
    global.fetch = jest.fn(() => Promise.resolve(mockResp));
  });
  afterEach(() => {
    // clean up mock
    delete global.fetch;
  });

  test('submits email and shows success message', async () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const email = screen.getByLabelText(/email/i);
    await userEvent.type(email, 'user@example.com');

    // component renders button text 'Send reset email'
    const submit = screen.getByRole('button', { name: /send reset email/i });
    await userEvent.click(submit);

    await waitFor(() => expect(screen.queryByText(/reset link sent/i)).toBeTruthy());
  });
});
