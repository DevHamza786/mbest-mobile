/**
 * TutorProfileCompleteScreen - MBEST Mobile App
 * Tutor profile completion flow for `tutor_profile_incomplete`
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { TutorStackParamList } from '../../types/navigation';
import { tutorService, type TutorProfileSettings } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { Header } from '../../components/common/Header';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';

const SUBJECTS = [
  'Biology',
  'Chemistry',
  'Computer Science',
  'English',
  'Mathematics',
  'Physics',
] as const;

const getNumberOrEmpty = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  return String(value);
};

export const TutorProfileCompleteScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<TutorStackParamList>>();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [wwccNumber, setWwccNumber] = useState('');
  const [wwccExpiryDate, setWwccExpiryDate] = useState('');
  const [maxStudentsPerGroup, setMaxStudentsPerGroup] = useState('');
  const [qualificationsText, setQualificationsText] = useState('');
  const [bio, setBio] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const subjectsSet = useMemo(() => new Set(selectedSubjects), [selectedSubjects]);

  const { data, isLoading } = useQuery({
    queryKey: ['tutorProfileSettings'],
    queryFn: () => tutorService.getProfileSettings(),
    enabled: !!token,
    retry: false,
  });

  React.useEffect(() => {
    if (!data?.data) return;
    const p = data.data as TutorProfileSettings;

    setPhone(p.phone ? String(p.phone) : '');
    setAddress(p.address ? String(p.address) : '');
    setDateOfBirth(p.date_of_birth ? String(p.date_of_birth) : '');
    setHourlyRate(getNumberOrEmpty(p.hourly_rate));
    setYearsExperience(getNumberOrEmpty(p.years_experience));
    setWwccNumber(p.wwcc_number ? String(p.wwcc_number) : '');
    setWwccExpiryDate(p.wwcc_expiry_date ? String(p.wwcc_expiry_date) : '');
    setMaxStudentsPerGroup(getNumberOrEmpty(p.max_students_per_group));

    const subjects = Array.isArray(p.subjects_taught) ? p.subjects_taught : [];
    setSelectedSubjects(subjects.map(String));

    if (Array.isArray(p.qualifications)) {
      setQualificationsText(p.qualifications.map(String).join(', '));
    } else if (typeof p.qualifications === 'string') {
      setQualificationsText(p.qualifications);
    } else {
      setQualificationsText('');
    }

    setBio(p.bio ? String(p.bio) : '');
  }, [data?.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<TutorProfileSettings>) =>
      tutorService.updateProfileSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tutorProfileSettings'] });
      Alert.alert('Success', 'Tutor profile updated successfully');
      navigation.navigate('TutorTabs');
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.message ||
        error?.message ||
        'Failed to update profile';
      Alert.alert('Error', msg);
    },
  });

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subject)) return prev.filter((s) => s !== subject);
      return [...prev, subject];
    });
  };

  const handleSave = () => {
    const payload: Partial<TutorProfileSettings> = {
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      date_of_birth: dateOfBirth.trim() || undefined,
      hourly_rate: hourlyRate.trim() || undefined,
      years_experience: yearsExperience.trim() || undefined,
      wwcc_number: wwccNumber.trim() || undefined,
      wwcc_expiry_date: wwccExpiryDate.trim() || undefined,
      max_students_per_group: maxStudentsPerGroup.trim() || undefined,
      subjects_taught: selectedSubjects.length ? selectedSubjects : undefined,
      qualifications: qualificationsText.trim() || undefined,
      bio: bio.trim() || undefined,
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Complete Tutor Profile" showBack={true} showProfile={false} />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Complete Tutor Profile" showBack={true} showProfile={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          Your tutor profile is incomplete. Please fill the required details to unlock dashboard.
        </Text>

        <Input label="Phone Number" value={phone} onChangeText={setPhone} placeholder="Enter phone number" />
        <Input label="Address" value={address} onChangeText={setAddress} placeholder="Enter address" />
        <Input
          label="Date of Birth"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD"
        />
        <Input
          label="Hourly Rate"
          value={hourlyRate}
          onChangeText={setHourlyRate}
          placeholder="e.g. 50.00"
          keyboardType="numeric"
        />
        <Input
          label="Years of Experience"
          value={yearsExperience}
          onChangeText={setYearsExperience}
          placeholder="e.g. 10"
          keyboardType="numeric"
        />
        <Input label="WWCC Number" value={wwccNumber} onChangeText={setWwccNumber} placeholder="Enter WWCC number" />
        <Input
          label="WWCC Expiry Date"
          value={wwccExpiryDate}
          onChangeText={setWwccExpiryDate}
          placeholder="YYYY-MM-DD"
        />
        <Input
          label="Max Students per Group"
          value={maxStudentsPerGroup}
          onChangeText={setMaxStudentsPerGroup}
          placeholder="e.g. 10"
          keyboardType="numeric"
        />

        <Text style={styles.sectionTitle}>Subjects Taught</Text>
        <View style={styles.chipsWrap}>
          {SUBJECTS.map((subject) => {
            const active = subjectsSet.has(subject);
            return (
              <TouchableOpacity
                key={subject}
                onPress={() => toggleSubject(subject)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{subject}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Qualifications (comma separated)"
          value={qualificationsText}
          onChangeText={setQualificationsText}
          placeholder="e.g. Master student / Teaching certificate"
        />

        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Write a short bio"
          multiline
          numberOfLines={5}
        />

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Icon name="calendar" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Availability</Text>
          </View>
          <Text style={styles.cardText}>
            Manage your weekly availability (required for sessions).
          </Text>
          <Button
            title="Manage Availability"
            onPress={() => navigation.navigate('TutorAvailability')}
            variant="outline"
            size="small"
          />
        </View>

        <View style={styles.actions}>
          <Button
            title={updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            onPress={handleSave}
            loading={updateMutation.isPending}
            variant="primary"
            disabled={updateMutation.isPending}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  lead: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextActive: {
    color: colors.primary,
  },
  card: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  cardText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  actions: {
    marginTop: spacing.md,
  },
});

