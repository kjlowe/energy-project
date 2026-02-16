import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import React, { useState } from 'react';
import YearSelector from './YearSelector';

const meta = {
  title: 'Components/YearSelector',
  component: YearSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof YearSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component with state management for interactive stories
const YearSelectorWithState: React.FC<{
  totalYears: number;
  yearLabels: string[];
}> = ({ totalYears, yearLabels }) => {
  const [yearIdx, setYearIdx] = useState(0);

  const handlePrevYear = () => {
    if (yearIdx > 0) setYearIdx(yearIdx - 1);
  };

  const handleNextYear = () => {
    if (yearIdx < totalYears - 1) setYearIdx(yearIdx + 1);
  };

  return (
    <YearSelector
      yearIdx={yearIdx}
      totalYears={totalYears}
      yearLabel={yearLabels[yearIdx]}
      onPrevYear={handlePrevYear}
      onNextYear={handleNextYear}
      onYearChange={setYearIdx}
    />
  );
};

export const Default: Story = {
  args: {
    yearIdx: 0,
    totalYears: 3,
    yearLabel: 'May 2023 - April 2024',
    onPrevYear: () => {},
    onNextYear: () => {},
    onYearChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify year label is displayed
    await expect(canvas.getByText(/May 2023 - April 2024/i)).toBeInTheDocument();

    // Verify year counter
    await expect(canvas.getByText(/Year: 1 of 3/i)).toBeInTheDocument();

    // Verify previous button is disabled (at first year)
    const buttons = canvas.getAllByRole('button');
    const prevButton = buttons[0];
    await expect(prevButton).toBeDisabled();
  },
};

export const SingleYear: Story = {
  args: {
    yearIdx: 0,
    totalYears: 1,
    yearLabel: 'May 2024 - June 2024',
    onPrevYear: () => {},
    onNextYear: () => {},
    onYearChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both buttons should be disabled
    const buttons = canvas.getAllByRole('button');
    const prevButton = buttons[0];
    const nextButton = buttons[1];

    await expect(prevButton).toBeDisabled();
    await expect(nextButton).toBeDisabled();

    // Dropdown should have only one option
    const select = canvas.getByRole('combobox');
    await expect(select).toBeInTheDocument();
  },
};

export const LastYear: Story = {
  args: {
    yearIdx: 2,
    totalYears: 3,
    yearLabel: 'May 2025 - July 2025',
    onPrevYear: () => {},
    onNextYear: () => {},
    onYearChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify year label
    await expect(canvas.getByText(/May 2025 - July 2025/i)).toBeInTheDocument();

    // Next button should be disabled (at last year)
    const buttons = canvas.getAllByRole('button');
    const nextButton = buttons[1];
    await expect(nextButton).toBeDisabled();

    // Previous button should be enabled
    const prevButton = buttons[0];
    await expect(prevButton).not.toBeDisabled();
  },
};

export const NavigateWithButtons: Story = {
  render: () => (
    <YearSelectorWithState
      totalYears={3}
      yearLabels={[
        'May 2023 - April 2024',
        'May 2024 - June 2024',
        'May 2025 - July 2025',
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify initial state
    await expect(canvas.getByText(/May 2023 - April 2024/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Year: 1 of 3/i)).toBeInTheDocument();

    // Click next button
    const buttons = canvas.getAllByRole('button');
    const nextButton = buttons[1];
    await user.click(nextButton);

    // Verify navigation to second year
    await expect(canvas.getByText(/May 2024 - June 2024/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Year: 2 of 3/i)).toBeInTheDocument();

    // Click next again
    await user.click(nextButton);

    // Verify navigation to third year
    await expect(canvas.getByText(/May 2025 - July 2025/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Year: 3 of 3/i)).toBeInTheDocument();

    // Click previous button
    const prevButton = buttons[0];
    await user.click(prevButton);

    // Verify back to second year
    await expect(canvas.getByText(/May 2024 - June 2024/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Year: 2 of 3/i)).toBeInTheDocument();
  },
};

export const NavigateWithDropdown: Story = {
  render: () => (
    <YearSelectorWithState
      totalYears={3}
      yearLabels={[
        'May 2023 - April 2024',
        'May 2024 - June 2024',
        'May 2025 - July 2025',
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Verify initial state
    await expect(canvas.getByText(/May 2023 - April 2024/i)).toBeInTheDocument();

    // Select third year from dropdown
    const select = canvas.getByRole('combobox');
    await user.selectOptions(select, '2');

    // Verify navigation to third year
    await expect(canvas.getByText(/May 2025 - July 2025/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Year: 3 of 3/i)).toBeInTheDocument();

    // Select first year
    await user.selectOptions(select, '0');

    // Verify back to first year
    await expect(canvas.getByText(/May 2023 - April 2024/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Year: 1 of 3/i)).toBeInTheDocument();
  },
};

export const LongYearLabel: Story = {
  args: {
    yearIdx: 0,
    totalYears: 2,
    yearLabel: 'November 2024 - February 2025',
    onPrevYear: () => {},
    onNextYear: () => {},
    onYearChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify long year label spanning calendar years
    await expect(
      canvas.getByText(/November 2024 - February 2025/i)
    ).toBeInTheDocument();
  },
};
