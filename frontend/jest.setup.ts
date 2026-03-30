import '@testing-library/jest-dom';
import React from 'react';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (
    props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean },
  ) => {
    // Next/Image-specific props should not be forwarded to native img in tests.
    const { priority: _priority, ...imgProps } = props;
    return React.createElement('img', imgProps);
  },
}));
