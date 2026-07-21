/**
 * UpgradePaymentScreen - Upload payment slip for the selected upgrade package.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { useMutation } from '@tanstack/react-query';
import { subscriptionService } from '../../services/api/subscription';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { ParentStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<ParentStackParamList, 'UpgradePayment'>;
type RouteProps = RouteProp<ParentStackParamList, 'UpgradePayment'>;

export const UpgradePaymentScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { packageId, packageName, packagePrice } = route.params;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string>('image/jpeg');
  const [imageName, setImageName] = useState<string>('payment_slip.jpg');

  const submitMutation = useMutation({
    mutationFn: (slip: { uri: string; type: string; name: string }) =>
      subscriptionService.submitPayment(packageId, slip),
    onSuccess: () => {
      Alert.alert(
        'Upgrade request submitted',
        'Your current plan stays active until an admin approves this request.',
        [{ text: 'OK', onPress: () => navigation.navigate('ParentTabs', { screen: 'ParentBilling' }) }]
      );
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Failed to submit upgrade request';
      Alert.alert('Error', msg);
    },
  });

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    const asset = result.assets?.[0];
    if (asset?.uri) {
      setImageUri(asset.uri);
      setImageType(asset.type || 'image/jpeg');
      setImageName(asset.fileName || 'payment_slip.jpg');
    }
  };

  const handleSubmit = () => {
    if (!imageUri) {
      Alert.alert('Missing payment slip', 'Please attach a photo of your payment slip.');
      return;
    }
    submitMutation.mutate({ uri: imageUri, type: imageType, name: imageName });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.summaryCard}>
        <Text style={styles.packageName}>{packageName}</Text>
        <Text style={styles.packagePrice}>${packagePrice}</Text>
      </Card>

      <Button title={imageUri ? 'Change Payment Slip' : 'Attach Payment Slip'} onPress={pickImage} />

      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

      <Button
        title={submitMutation.isPending ? 'Submitting…' : 'Submit Upgrade Request'}
        onPress={handleSubmit}
        disabled={submitMutation.isPending || !imageUri}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  summaryCard: { padding: spacing.md, marginBottom: spacing.md },
  packageName: { fontSize: 16, fontWeight: '700', color: colors.text },
  packagePrice: { fontSize: 14, color: colors.primary, marginTop: 4 },
  preview: { width: '100%', height: 200, borderRadius: borderRadius.md, marginVertical: spacing.md },
});
