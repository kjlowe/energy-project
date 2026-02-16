import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within, waitFor } from 'storybook/test';
import App from './App';
import { multipleYearsHandler, emptyYearsHandler } from './test/mocks/handlers';

const meta = {
  title: 'App',
  component: App,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultipleYears: Story = {
  parameters: {
    msw: {
      handlers: [multipleYearsHandler],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for data to load
    await waitFor(
      () => {
        expect(canvas.queryByText(/Loading data visualization/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify year selector is displayed
    await expect(canvas.getByText(/Year: 1 of 3/i)).toBeInTheDocument();

    // Verify first year label (12-month year)
    await expect(canvas.getByText(/May 2023 - April 2024/i)).toBeInTheDocument();

    // Verify tab navigation is present
    await expect(canvas.getByText(/Month by Month/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Full Year Data/i)).toBeInTheDocument();

    // Verify Solar component is displayed by default (month view)
    await expect(canvas.getByText(/Month: May/i)).toBeInTheDocument();

    // Navigate to next year
    const buttons = canvas.getAllByRole('button');
    const nextYearButton = buttons.find((btn) => btn.textContent === '→');
    if (nextYearButton) {
      await user.click(nextYearButton);
    }

    // Verify second year is displayed
    await expect(canvas.getByText(/Year: 2 of 3/i)).toBeInTheDocument();
    await expect(canvas.getByText(/May 2024 - June 2024/i)).toBeInTheDocument();
  },
};

export const SingleYear: Story = {
  // Uses default handler (single year)
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for data to load
    await waitFor(
      () => {
        expect(canvas.queryByText(/Loading data visualization/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify year selector shows single year
    await expect(canvas.getByText(/Year: 1 of 1/i)).toBeInTheDocument();

    // Both navigation buttons should be disabled
    const buttons = canvas.getAllByRole('button');
    const prevButton = buttons.find((btn) => btn.textContent === '←');
    const nextButton = buttons.find((btn) => btn.textContent === '→');

    if (prevButton) await expect(prevButton).toBeDisabled();
    if (nextButton) await expect(nextButton).toBeDisabled();

    // Verify default view (month)
    await expect(canvas.getByText(/Month by Month/i)).toBeInTheDocument();
  },
};

export const EmptyYears: Story = {
  parameters: {
    msw: {
      handlers: [emptyYearsHandler],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for data to load
    await waitFor(
      () => {
        expect(canvas.queryByText(/Loading data visualization/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify error message is displayed
    await expect(
      canvas.getByText(/No billing data available/i)
    ).toBeInTheDocument();

    // No year selector or tabs should be present
    const yearSelector = canvas.queryByText(/Year:/i);
    expect(yearSelector).not.toBeInTheDocument();
  },
};

export const YearToYearNavigation: Story = {
  parameters: {
    msw: {
      handlers: [multipleYearsHandler],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for data to load
    await waitFor(
      () => {
        expect(canvas.queryByText(/Loading data visualization/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Start at first year, month view
    await expect(canvas.getByText(/May 2023 - April 2024/i)).toBeInTheDocument();

    // Switch to year view
    const yearTab = canvas.getByRole('tab', { name: /Full Year Data/i });
    await user.click(yearTab);

    // Verify year view is active - shows Excel-style table
    await expect(canvas.getByText('month_label')).toBeInTheDocument();

    // Navigate to next year
    const buttons = canvas.getAllByRole('button');
    const nextYearButton = buttons.find((btn) => btn.textContent === '→');
    if (nextYearButton) {
      await user.click(nextYearButton);
    }

    // Verify tab resets to month view when year changes
    await expect(canvas.getByText(/Month: May/i)).toBeInTheDocument();

    // Year view should no longer be active
    const monthTab = canvas.getByRole('tab', { name: /Month by Month/i });
    await expect(monthTab).toHaveAttribute('aria-selected', 'true');
  },
};

export const MonthAndYearToggle: Story = {
  parameters: {
    msw: {
      handlers: [multipleYearsHandler],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for data to load
    await waitFor(
      () => {
        expect(canvas.queryByText(/Loading data visualization/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify month view is active
    const monthTab = canvas.getByRole('tab', { name: /Month by Month/i });
    const yearTab = canvas.getByRole('tab', { name: /Full Year Data/i });

    await expect(monthTab).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByText(/Month: May/i)).toBeInTheDocument();

    // Switch to year view
    await user.click(yearTab);

    // Verify year view is displayed
    await expect(yearTab).toHaveAttribute('aria-selected', 'true');
    // Year view shows Excel-style table with multi-level headers
    await expect(canvas.getByText('month_label')).toBeInTheDocument();
    await expect(canvas.getByText('main')).toBeInTheDocument();

    // Switch back to month view
    await user.click(monthTab);

    // Verify month view is restored
    await expect(monthTab).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByText(/Month: May/i)).toBeInTheDocument();
  },
};
