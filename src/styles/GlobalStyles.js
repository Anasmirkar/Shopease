/**
 * Global Styles
 * Common styles used throughout the application
 */

import { StyleSheet } from 'react-native';
import { Colors, Typography, Dimensions } from '../constants';

export const GlobalStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND_WHITE,
  },
  
  containerCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.BACKGROUND_WHITE,
  },
  
  containerPadded: {
    flex: 1,
    padding: Dimensions.SPACING_MEDIUM,
    backgroundColor: Colors.BACKGROUND_WHITE,
  },
  
  // Text Styles
  textPrimary: {
    fontSize: Typography.FONT_SIZE_MEDIUM,
    color: Colors.TEXT_PRIMARY,
    fontWeight: Typography.FONT_WEIGHT_REGULAR,
  },
  
  textSecondary: {
    fontSize: Typography.FONT_SIZE_SMALL,
    color: Colors.TEXT_SECONDARY,
    fontWeight: Typography.FONT_WEIGHT_REGULAR,
  },
  
  textTitle: {
    fontSize: Typography.FONT_SIZE_TITLE,
    color: Colors.TEXT_PRIMARY,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
  },
  
  textHeader: {
    fontSize: Typography.FONT_SIZE_HEADER,
    color: Colors.TEXT_PRIMARY,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
  },
  
  textWhite: {
    color: Colors.TEXT_WHITE,
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  // Button Styles
  buttonPrimary: {
    backgroundColor: Colors.PRIMARY_GREEN,
    paddingVertical: Dimensions.SPACING_MEDIUM,
    paddingHorizontal: Dimensions.SPACING_LARGE,
    borderRadius: Dimensions.BORDER_RADIUS_MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonSecondary: {
    backgroundColor: Colors.ACCENT_TEAL,
    paddingVertical: Dimensions.SPACING_MEDIUM,
    paddingHorizontal: Dimensions.SPACING_LARGE,
    borderRadius: Dimensions.BORDER_RADIUS_MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    paddingVertical: Dimensions.SPACING_MEDIUM,
    paddingHorizontal: Dimensions.SPACING_LARGE,
    borderRadius: Dimensions.BORDER_RADIUS_MEDIUM,
    borderWidth: 2,
    borderColor: Colors.PRIMARY_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonText: {
    fontSize: Typography.FONT_SIZE_LARGE,
    fontWeight: Typography.FONT_WEIGHT_SEMI_BOLD,
    color: Colors.TEXT_WHITE,
  },
  
  buttonTextOutline: {
    fontSize: Typography.FONT_SIZE_LARGE,
    fontWeight: Typography.FONT_WEIGHT_SEMI_BOLD,
    color: Colors.PRIMARY_GREEN,
  },
  
  // Input Styles
  input: {
    borderWidth: 1,
    borderColor: Colors.GRAY_MEDIUM,
    borderRadius: Dimensions.BORDER_RADIUS_MEDIUM,
    paddingVertical: Dimensions.SPACING_MEDIUM,
    paddingHorizontal: Dimensions.SPACING_MEDIUM,
    fontSize: Typography.FONT_SIZE_MEDIUM,
    color: Colors.TEXT_PRIMARY,
    backgroundColor: Colors.WHITE,
  },
  
  inputFocused: {
    borderColor: Colors.PRIMARY_GREEN,
    borderWidth: 2,
  },
  
  inputError: {
    borderColor: Colors.ERROR,
    borderWidth: 2,
  },
  
  // Card Styles
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: Dimensions.BORDER_RADIUS_MEDIUM,
    padding: Dimensions.SPACING_MEDIUM,
    shadowColor: Colors.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY_LIGHT,
    paddingBottom: Dimensions.SPACING_SMALL,
    marginBottom: Dimensions.SPACING_MEDIUM,
  },
  
  // List Styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Dimensions.SPACING_MEDIUM,
    paddingHorizontal: Dimensions.SPACING_MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY_LIGHT,
  },
  
  listItemContent: {
    flex: 1,
    marginLeft: Dimensions.SPACING_MEDIUM,
  },
  
  // Spacing
  marginSmall: { margin: Dimensions.SPACING_SMALL },
  marginMedium: { margin: Dimensions.SPACING_MEDIUM },
  marginLarge: { margin: Dimensions.SPACING_LARGE },
  
  paddingSmall: { padding: Dimensions.SPACING_SMALL },
  paddingMedium: { padding: Dimensions.SPACING_MEDIUM },
  paddingLarge: { padding: Dimensions.SPACING_LARGE },
  
  // Flex
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  flexColumn: { flexDirection: 'column' },
  
  justifyCenter: { justifyContent: 'center' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyAround: { justifyContent: 'space-around' },
  
  alignCenter: { alignItems: 'center' },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  
  // Shadows
  shadowLight: {
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  shadowMedium: {
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  
  shadowHeavy: {
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default GlobalStyles;