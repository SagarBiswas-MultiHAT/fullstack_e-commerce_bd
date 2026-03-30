declare module 'react-image-magnifiers' {
  import type { ComponentType } from 'react';

  export interface SideBySideMagnifierProps {
    imageSrc: string;
    largeImageSrc: string;
    alwaysInPlace?: boolean;
    fillAvailableSpace?: boolean;
    overlayOpacity?: number;
    className?: string;
  }

  export const SideBySideMagnifier: ComponentType<SideBySideMagnifierProps>;
}
