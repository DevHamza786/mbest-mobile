/**
 * SubscriptionPaymentScreen - Upload payment slip for selected package
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  AppState,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { useMutation } from '@tanstack/react-query';
import { subscriptionService } from '../../services/api/subscription';
import { useAuthStore } from '../../store/authStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import type { SubscriptionStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<SubscriptionStackParamList, 'SubscriptionPayment'>;

export const SubscriptionPaymentScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { token } = useAuthStore();
  const { selectedPackage, setSelectedPackage } = useSubscriptionStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string>('image/jpeg');
  const [imageName, setImageName] = useState<string>('payment_slip.jpg');
  const appState = useRef(AppState.currentState);

  const submitMutation = useMutation({
    mutationFn: (slip: { uri: string; type: string; name: string }) =>
      subscriptionService.submitPayment(selectedPackage!.id, slip),
    onSuccess: () => {
      setSelectedPackage(null);
      setImageUri(null);
      navigation.replace('SubscriptionPending');
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.payment_slip?.[0] ||
        error.message ||
        'Failed to submit payment';
      Alert.alert('Error', msg);
    },
  });

  const showAlertSafely = (title: string, message: string) => {
    // Check if app is in foreground before showing alert
    const currentState = AppState.currentState;
    if (currentState === 'active') {
      // Use requestAnimationFrame to ensure we're in the right context
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            Alert.alert(title, message);
          } catch (error) {
            console.error('Failed to show alert:', error);
          }
        }, 300);
      });
    } else {
      console.warn('App not active, cannot show alert:', title, message);
    }
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    console.log('Image picker response:', response);
    
    if (response.didCancel) {
      console.log('User cancelled image picker');
      return;
    }
    
    if (response.errorCode) {
      console.error('Image picker error:', response.errorCode, response.errorMessage);
      let errorMsg = 'Failed to pick image';
      
      if (response.errorCode === 'permission') {
        errorMsg = 'Permission denied. Please allow camera and photo access in device settings.';
      } else if (response.errorCode === 'others') {
        // "Activity error" on Android - usually means activity context lost
        // Try to provide helpful message
        if (Platform.OS === 'android') {
          errorMsg = 'Unable to access gallery. Please ensure the app has photo access permission and try again.';
        } else {
          errorMsg = 'Unable to access image. Please try again.';
        }
      } else if (response.errorCode === 'camera_unavailable') {
        errorMsg = 'Camera is not available on this device.';
      } else if (response.errorMessage) {
        errorMsg = response.errorMessage;
      }
      
      // Don't show alert immediately - wait a bit for activity to be ready
      setTimeout(() => {
        showAlertSafely('Error', errorMsg);
      }, 500);
      return;
    }
    
    const asset = response.assets?.[0];
    if (!asset) {
      console.error('No asset found in response');
      showAlertSafely('Error', 'No image selected');
      return;
    }
    
    if (!asset.uri) {
      console.error('No URI found in asset');
      showAlertSafely('Error', 'Invalid image file');
      return;
    }
    
    // Ensure proper MIME type
    const mimeType = asset.type || 'image/jpeg';
    // Ensure proper filename with extension
    const fileName = asset.fileName || asset.uri.split('/').pop() || 'payment_slip.jpg';
    
    setImageUri(asset.uri);
    setImageType(mimeType);
    setImageName(fileName);
    
    console.log('Image selected successfully:', {
      uri: asset.uri,
      type: mimeType,
      name: fileName,
      fileSize: asset.fileSize,
    });
  };

  const requestAndroidPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      // For Android 13+ (API 33+), use READ_MEDIA_IMAGES
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Photo Permission',
            message: 'App needs access to your photos to upload payment slips',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // For Android 12 and below, use READ_EXTERNAL_STORAGE
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to upload payment slips',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  const pickImage = async () => {
    console.log('pickImage called');
    
    try {
      // Request permissions on Android first
      if (Platform.OS === 'android') {
        const hasPermission = await requestAndroidPermissions();
        if (!hasPermission) {
          showAlertSafely(
            'Permission Denied',
            'Photo access permission is required to upload payment slips. Please enable it in app settings.'
          );
          return;
        }
      }

      // Directly open gallery - simpler and more reliable
      const options: any = {
        mediaType: 'photo',
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.8,
        includeBase64: false,
        selectionLimit: 1,
      };
      
      // Only add iOS-specific options on iOS
      if (Platform.OS === 'ios') {
        options.presentationStyle = 'pageSheet';
      }
      
      launchImageLibrary(options, handleImageResponse);
    } catch (error: any) {
      console.error('Error launching image library:', error);
      showAlertSafely('Error', 'Failed to open image picker. Please try again.');
    }
  };

  const handleSubmit = () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a package first');
      navigation.goBack();
      return;
    }
    if (!imageUri) {
      Alert.alert('Error', 'Please select a payment slip image');
      return;
    }
    
    // Ensure we have proper file extension
    let finalFileName = imageName;
    if (!finalFileName.match(/\.(jpg|jpeg|png|pdf)$/i)) {
      finalFileName = finalFileName.replace(/\.[^/.]+$/, '') + '.jpg';
    }
    
    console.log('Submitting payment with:', {
      packageId: selectedPackage.id,
      uri: imageUri,
      type: imageType,
      name: finalFileName,
    });
    
    submitMutation.mutate({ 
      uri: imageUri, 
      type: imageType || 'image/jpeg', 
      name: finalFileName 
    });
  };

  if (!selectedPackage) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No package selected</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} variant="outline" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card variant="elevated" style={styles.packageCard}>
        <Text style={styles.packageName}>{selectedPackage.name}</Text>
        <Text style={styles.packagePrice}>${selectedPackage.price}</Text>
        <Text style={styles.packageDesc}>{selectedPackage.description}</Text>
      </Card>

      {selectedPackage.bank_details && (
        <Card variant="outlined" style={styles.bankCard}>
          <Text style={styles.bankTitle}>Bank Transfer Details</Text>
          <Text style={styles.bankDetails}>{selectedPackage.bank_details}</Text>
        </Card>
      )}

      <View style={styles.uploadSection}>
        <Text style={styles.sectionTitle}>Upload Payment Slip</Text>
        <Text style={styles.sectionSubtitle}>
          Take a photo or select an image of your payment slip (JPEG, PNG, max 10MB)
        </Text>

        <TouchableOpacity
          style={[styles.uploadArea, imageUri && styles.uploadAreaFilled]}
          onPress={pickImage}
          activeOpacity={0.7}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <>
              <Icon name="upload" size={48} color={colors.textTertiary} />
              <Text style={styles.uploadText}>Tap to select image</Text>
            </>
          )}
        </TouchableOpacity>

        {imageUri && (
          <TouchableOpacity style={styles.changeButton} onPress={pickImage} activeOpacity={0.7}>
            <Text style={styles.changeButtonText}>Change Image</Text>
          </TouchableOpacity>
        )}
      </View>

      <Button
        title={submitMutation.isPending ? 'Submitting...' : 'Submit Payment'}
        onPress={handleSubmit}
        disabled={!imageUri || submitMutation.isPending}
        variant="primary"
        style={styles.submitButton}
      />

      <TouchableOpacity
        style={styles.backLink}
        onPress={() => navigation.goBack()}
        disabled={submitMutation.isPending}
      >
        <Icon name="chevron-left" size={16} color={colors.primary} />
        <Text style={styles.backLinkText}>Back to packages</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  packageCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  packageName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  packageDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  bankCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  bankDetails: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    includeFontPadding: false,
  },
  uploadSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
    includeFontPadding: false,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  uploadAreaFilled: {
    borderStyle: 'solid',
    padding: spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
  uploadText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    includeFontPadding: false,
  },
  changeButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  submitButton: {
    marginBottom: spacing.lg,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
});
