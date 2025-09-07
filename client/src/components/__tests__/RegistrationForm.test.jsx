import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegistrationForm from '../RegistrationForm';

describe('RegistrationForm password field', () => {
  test('shows strength feedback when typing password', async () => {
    render(
      <MemoryRouter>
        <RegistrationForm />
      </MemoryRouter>
    );
  // target the exact Password field (avoid Confirm Password)
  const pwd = screen.getByLabelText('Password');
  await userEvent.type(pwd, 'password');
  // strength label shows bits text like 'bits' — assert that appears
  const bitsText = await screen.findByText(/bits/i);
  expect(bitsText).toBeTruthy();
  });
});
