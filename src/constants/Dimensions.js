/**
 * Dimension Constants
 * Centralized dimension definitions for the Scanto app
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Dimensions = {
  // Screen Dimensions
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  
  // Scanner Dimensions
  SCANNER_SIZE: 280,
  SCANNER_CORNER_SIZE: 25,
  SCANNER_BORDER_WIDTH: 4,
  
  // Spacing
  SPACING_TINY: 4,
  SPACING_SMALL: 8,
  SPACING_MEDIUM: 16,
  SPACING_LARGE: 24,
  SPACING_EXTRA_LARGE: 32,
  
  // Border Radius
  BORDER_RADIUS_SMALL: 8,
  BORDER_RADIUS_MEDIUM: 12,
  BORDER_RADIUS_LARGE: 16,
  BORDER_RADIUS_EXTRA_LARGE: 20,
  BORDER_RADIUS_ROUND: 25,
  
  // Button Dimensions
  BUTTON_HEIGHT: 50,
  BUTTON_HEIGHT_SMALL: 40,
  FLOATING_BUTTON_SIZE: 50,
  
  // Header Height
  HEADER_HEIGHT: 60,
  STATUS_BAR_HEIGHT: 40,
  
  // Icon Sizes
  ICON_TINY: 16,
  ICON_SMALL: 20,
  ICON_MEDIUM: 24,
  ICON_LARGE: 28,
  ICON_EXTRA_LARGE: 32,
  
  // Animation Values
  ANIMATION_DURATION_SHORT: 200,
  ANIMATION_DURATION_MEDIUM: 300,
  ANIMATION_DURATION_LONG: 500,
};

export default Dimensions;