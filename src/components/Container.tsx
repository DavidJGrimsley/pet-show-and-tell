import { type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';

interface ContainerProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const Container = ({ children, style }: ContainerProps) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  return (
    <View style={[styles.outer, style]}>
      <View style={[styles.inner, isLargeScreen ? styles.largeWidth : styles.smallWidth]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    alignSelf: 'center',
  },
  smallWidth: {
    width: '95%',
  },
  largeWidth: {
    width: '80%',
  },
});
