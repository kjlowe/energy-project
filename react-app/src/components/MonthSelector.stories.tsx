import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent, fireEvent } from 'storybook/test';
import { useState } from 'react';
import MonthSelector from './MonthSelector';

const meta = {
  title: 'Components/MonthSelector',
  component: MonthSelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Month navigation component with previous/next buttons and slider for selecting billing months.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    monthIdx: {
      control: { type: 'number', min: 0, max: 11 },
      description: 'Current month index (0-based)',
    },
    totalMonths: {
      control: { type: 'number', min: 1, max: 12 },
      description: 'Total number of months available',
    },
    monthName: {
      control: 'text',
      description: 'Month name to display',
    },
  },
} satisfies Meta<typeof MonthSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

// ==================== HELPER COMPONENT ====================

// Wrapper component to manage state for interactive stories
const MonthSelectorWithState = ({ initialMonthIdx = 0, totalMonths = 2, monthNames = ['May', 'June'] }: { initialMonthIdx?: number; totalMonths?: number; monthNames?: string[] }) => {
  const [monthIdx, setMonthIdx] = useState(initialMonthIdx);

  const handlePrevMonth = () => {
    if (monthIdx > 0) setMonthIdx(monthIdx - 1);
  };

  const handleNextMonth = () => {
    if (monthIdx < totalMonths - 1) setMonthIdx(monthIdx + 1);
  };

  return (
    <MonthSelector
      monthIdx={monthIdx}
      totalMonths={totalMonths}
      monthName={monthNames[monthIdx] ?? 'Unknown'}
      onPrevMonth={handlePrevMonth}
      onNextMonth={handleNextMonth}
      onMonthChange={setMonthIdx}
    />
  );
};

// ==================== STORIES ====================

/**
 * Default state with multiple months available.
 * Both navigation buttons are enabled.
 */
export const Default: Story = {
  render: () => <MonthSelectorWithState />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify month display
    await expect(canvas.getByText(/Month: May/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Month: 1/i)).toBeInTheDocument();

    // Verify buttons exist and prev is disabled (first month)
    const buttons = canvas.getAllByRole('button');
    expect(buttons[0]).toBeDisabled(); // prev button disabled on first month
    expect(buttons[1]).not.toBeDisabled(); // next button enabled

    // Verify slider
    const slider = canvas.getByRole('slider') as HTMLInputElement;
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '1');
    expect(slider.value).toBe('0');
  },
};

/**
 * Single month - both buttons disabled.
 * Slider has max=0.
 */
export const SingleMonth: Story = {
  render: () => <MonthSelectorWithState totalMonths={1} monthNames={['May']} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both navigation buttons should be disabled
    const buttons = canvas.getAllByRole('button');
    expect(buttons[0]).toBeDisabled(); // prev
    expect(buttons[1]).toBeDisabled(); // next

    // Slider should have max=0
    const slider = canvas.getByRole('slider') as HTMLInputElement;
    expect(slider).toHaveAttribute('max', '0');
  },
};

/**
 * First month - previous button disabled.
 */
export const FirstMonth: Story = {
  render: () => <MonthSelectorWithState initialMonthIdx={0} totalMonths={3} monthNames={['January', 'February', 'March']} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Previous button should be disabled
    const buttons = canvas.getAllByRole('button');
    expect(buttons[0]).toBeDisabled(); // prev
    expect(buttons[1]).not.toBeDisabled(); // next

    // Verify month display
    await expect(canvas.getByText(/Month: January/i)).toBeInTheDocument();
  },
};

/**
 * Last month - next button disabled.
 */
export const LastMonth: Story = {
  render: () => <MonthSelectorWithState initialMonthIdx={2} totalMonths={3} monthNames={['January', 'February', 'March']} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Next button should be disabled
    const buttons = canvas.getAllByRole('button');
    expect(buttons[0]).not.toBeDisabled(); // prev
    expect(buttons[1]).toBeDisabled(); // next

    // Verify month display
    await expect(canvas.getByText(/Month: March/i)).toBeInTheDocument();
  },
};

/**
 * Interactive navigation test - button clicks.
 */
export const NavigateWithButtons: Story = {
  render: () => <MonthSelectorWithState totalMonths={3} monthNames={['May', 'June', 'July']} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Start at May
    await expect(canvas.getByText(/Month: May/i)).toBeInTheDocument();

    // Click next button to navigate to June
    const buttons = canvas.getAllByRole('button');
    const nextButton = buttons[1];
    if (nextButton) {
      await user.click(nextButton);
    }

    // Should now show June
    await expect(canvas.getByText(/Month: June/i)).toBeInTheDocument();

    // Click next again to navigate to July
    if (nextButton) {
      await user.click(nextButton);
    }

    // Should now show July
    await expect(canvas.getByText(/Month: July/i)).toBeInTheDocument();

    // Click previous button to go back to June
    const prevButton = buttons[0];
    if (prevButton) {
      await user.click(prevButton);
    }

    // Should be back at June
    await expect(canvas.getByText(/Month: June/i)).toBeInTheDocument();
  },
};

/**
 * Interactive navigation test - slider.
 */
export const NavigateWithSlider: Story = {
  render: () => <MonthSelectorWithState totalMonths={3} monthNames={['May', 'June', 'July']} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Start at May (index 0)
    await expect(canvas.getByText(/Month: May/i)).toBeInTheDocument();

    // Use slider to navigate to June (index 1)
    const slider = canvas.getByRole('slider');
    fireEvent.change(slider, { target: { value: '1' } });

    // Should show June
    await expect(canvas.getByText(/Month: June/i)).toBeInTheDocument();

    // Use slider to navigate to July (index 2)
    fireEvent.change(slider, { target: { value: '2' } });

    // Should show July
    await expect(canvas.getByText(/Month: July/i)).toBeInTheDocument();
  },
};
