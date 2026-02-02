/**
 * Modal Component - Reusable modal wrapper
 */

import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Icon } from './Icon';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  maxHeight?: number;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  maxHeight,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardView}
            >
              <View
                style={[
                  styles.modalContainer,
                  { maxHeight: maxHeight || '90%' },
                  { paddingBottom: Math.max(insets.bottom, spacing.md) },
                ]}
              >
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  {showCloseButton && (
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeButton}
                      activeOpacity={0.7}
                    >
                      <Icon name="x" size={24} color={colors.text} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Content */}
                <ScrollView
                  style={styles.content}
                  contentContainerStyle={styles.contentContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {children}
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    includeFontPadding: false,
    lineHeight: 28,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
});
