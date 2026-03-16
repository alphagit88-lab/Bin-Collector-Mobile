import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import OperationsBottomNavBar from '../components/OperationsBottomNavBar';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import toast from '../utils/toast';

// Header truck/logo SVGs
import Logo14_1 from '../assets/images/14_1.svg';
import Svg14 from '../assets/images/3_1.svg';

const { width: screenWidth } = Dimensions.get('window');

interface DaySchedule {
  day: string;
  isClosed: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: 'Monday', isClosed: false, startTime: '07:00 AM', endTime: '05:00 PM' },
  { day: 'Tuesday', isClosed: false, startTime: '07:00 AM', endTime: '05:00 PM' },
  { day: 'Wednesday', isClosed: false, startTime: '07:00 AM', endTime: '05:00 PM' },
  { day: 'Thursday', isClosed: false, startTime: '07:00 AM', endTime: '05:00 PM' },
  { day: 'Friday', isClosed: false, startTime: '07:00 AM', endTime: '05:00 PM' },
  { day: 'Saturday', isClosed: false, startTime: '07:00 AM', endTime: '03:00 PM' },
  { day: 'Sunday', isClosed: true, startTime: '09:00 AM', endTime: '05:00 PM' },
];

const SupplierAvailabilityScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);

  // Time picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ availability: DaySchedule[] }>(ENDPOINTS.SUPPLIER.AVAILABILITY);
      if (response.success && response.data?.availability && response.data.availability.length > 0) {
        // Merge with default schedule to ensure all days are present
        const fetchedSchedule = response.data.availability;
        const mergedSchedule = DEFAULT_SCHEDULE.map(defaultDay => {
          const found = fetchedSchedule.find(f => f.day === defaultDay.day);
          return found ? { ...found } : { ...defaultDay };
        });
        setSchedule(mergedSchedule);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Error', 'Failed to load availability settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAvailability();
    }, [fetchAvailability])
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.post(ENDPOINTS.SUPPLIER.AVAILABILITY, { schedule });
      if (response.success) {
        toast.success('Success', 'Availability updated successfully.');
      } else {
        toast.error('Error', response.message || 'Failed to update availability.');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Error', 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const toggleClosed = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].isClosed = !newSchedule[index].isClosed;
    setSchedule(newSchedule);
  };

  const openTimePicker = (index: number, mode: 'start' | 'end') => {
    setActiveDayIndex(index);
    setPickerMode(mode);

    // Parse current time string to Date object for the picker
    const timeStr = mode === 'start' ? schedule[index].startTime : schedule[index].endTime;
    const date = new Date();
    // Default format "HH:MM AM/PM"
    const [time, period] = timeStr.split(' ');
    if (time && period) {
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      date.setHours(hours, minutes, 0, 0);
    }

    setTempDate(date);
    setShowPicker(true);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // On Android, close immediately
    if (selectedDate && activeDayIndex !== null) {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      let displayHours = hours % 12;
      displayHours = displayHours ? displayHours : 12; // the hour '0' should be '12'
      const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const timeString = `${displayHours.toString().padStart(2, '0')}:${displayMinutes} ${ampm}`;

      const newSchedule = [...schedule];
      if (pickerMode === 'start') {
        newSchedule[activeDayIndex].startTime = timeString;
      } else {
        newSchedule[activeDayIndex].endTime = timeString;
      }
      setSchedule(newSchedule);
    } else {
      // Cancelled
      setShowPicker(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Section with Gradient Background */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#37B112', '#77C40A']}
            locations={[0.2227, 0.5982]}
            start={{ x: 0.12, y: 0.05 }}
            end={{ x: 0.88, y: 0.95 }}
            style={styles.headerGradient}>
            {/* subtle translucent overlay */}
            <LinearGradient
              colors={['rgba(137,217,87,0.2)', 'rgba(137,217,87,0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.overlayGradient}
              pointerEvents="none"
            />

            {/* Title and Subtitle */}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Operations</Text>
              <Text style={styles.headerSubtitle}>Edit service coverage</Text>
            </View>

            <View style={styles.decorativeImageContainer}>
              <Logo14_1 width={148} height={63} />
            </View>

            <View style={styles.headerSvgContainer} pointerEvents="none">
              <Svg14 width={screenWidth - 4} height={177} />
            </View>
          </LinearGradient>
        </View>

        {/* Availability Management Card */}
        <View style={styles.availabilityCardContainer}>
          <LinearGradient
            colors={['#C0F96F', '#90B93E']}
            locations={[0.2009, 0.7847]}
            start={{ x: 0.15, y: 0.1 }}
            end={{ x: 0.85, y: 0.9 }}
            style={styles.availabilityCard}>
            <Text style={styles.availabilityTitle}>
              Availability Management
            </Text>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
              <View style={styles.backArrowCircle}>
                <Text style={styles.backArrow}>→</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Schedule Card */}
        <View style={styles.scheduleContainer}>
          <LinearGradient
            colors={['#EFF2F0', '#EAFFCC']}
            locations={[0.2377, 0.6629]}
            start={{ x: 0.11, y: 0 }}
            end={{ x: 0.89, y: 1 }}
            style={styles.scheduleCard}>
            {/* Set operating hours Title */}
            <Text style={styles.scheduleTitle}>Set operating hours</Text>

            <View style={styles.legendContainer}>
              <Text style={styles.legendText}>(Check to open, Uncheck to close)</Text>
            </View>

            {/* Schedule Rows */}
            {schedule.map((item, index) => (
              <View key={item.day} style={styles.scheduleRow}>
                {/* Checkbox */}
                <TouchableOpacity
                  style={styles.checkbox}
                  activeOpacity={0.7}
                  onPress={() => toggleClosed(index)}>
                  <LinearGradient
                    colors={['#EFF2F0', '#EAFFCC']}
                    locations={[0.2377, 0.6629]}
                    start={{ x: 0.11, y: 0 }}
                    end={{ x: 0.89, y: 1 }}
                    style={styles.checkboxGradient}>
                    {/* Render Checkmark if NOT closed */}
                    {!item.isClosed && <Text style={styles.checkmark}>✓</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Day Name */}
                <Text style={styles.dayName}>{item.day}</Text>

                {/* Time Boxes */}
                {item.isClosed ? (
                  <View style={styles.closedContainer}>
                    <LinearGradient
                      colors={['#EFF2F0', '#EAFFCC']}
                      locations={[0.2377, 0.6629]}
                      start={{ x: 0.11, y: 0 }}
                      end={{ x: 0.89, y: 1 }}
                      style={styles.closedBox}>
                      <Text style={styles.timeText}>Closed</Text>
                    </LinearGradient>
                  </View>
                ) : (
                  <View style={styles.timeContainer}>
                    <TouchableOpacity onPress={() => openTimePicker(index, 'start')}>
                      <LinearGradient
                        colors={['#EFF2F0', '#EAFFCC']}
                        locations={[0.2377, 0.6629]}
                        start={{ x: 0.11, y: 0 }}
                        end={{ x: 0.89, y: 1 }}
                        style={styles.timeBox}>
                        <Text style={styles.timeText}>{item.startTime}</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => openTimePicker(index, 'end')}>
                      <LinearGradient
                        colors={['#EFF2F0', '#EAFFCC']}
                        locations={[0.2377, 0.6629]}
                        start={{ x: 0.11, y: 0 }}
                        end={{ x: 0.89, y: 1 }}
                        style={styles.timeBox}>
                        <Text style={styles.timeText}>{item.endTime}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient
                colors={['#29B554', '#6EAD16']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </LinearGradient>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Date Time Picker Modal (Android/iOS handled) */}
      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      <OperationsBottomNavBar activeTab="operations" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerGradient: {
    height: 241,
    paddingTop: 20,
    paddingHorizontal: 19,
    position: 'relative',
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
  },
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    zIndex: 1,
  },
  headerTextContainer: {
    zIndex: 3,
  },
  headerTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 26,
    lineHeight: 28,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    lineHeight: 17,
    color: '#FFFFFF',
    marginTop: 4,
  },
  decorativeImageContainer: {
    position: 'absolute',
    right: 0,
    top: 9,
    width: 148,
    height: 63,
    zIndex: 2,
  },
  headerSvgContainer: {
    position: 'absolute',
    left: 2,
    top: 64,
    width: 430 - 4,
    height: 177,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 2,
  },
  availabilityCardContainer: {
    paddingHorizontal: 19,
    marginBottom: 16,
  },
  availabilityCard: {
    height: 67,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  availabilityTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 24,
    color: '#373934',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 14,
    paddingVertical: 5,
    paddingLeft: 12,
    paddingRight: 5,
    height: 27,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButtonText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    lineHeight: 19,
    color: '#FFFFFF',
    marginRight: 8,
  },
  backArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 12,
    color: '#252525',
    fontWeight: '600',
  },
  scheduleContainer: {
    paddingHorizontal: 19,
  },
  scheduleCard: {
    borderRadius: 9,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  scheduleTitle: {
    fontFamily: fonts.family.leagueSpartanSemiBold,
    fontSize: 20,
    lineHeight: 18,
    color: '#242424',
    textAlign: 'center',
    marginBottom: 5,
  },
  legendContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  legendText: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#666',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    marginRight: 7,
  },
  checkboxGradient: {
    width: 18,
    height: 18,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 12,
    color: '#242424',
    fontWeight: '600',
  },
  dayName: {
    fontFamily: fonts.family.leagueSpartanSemiBold,
    fontSize: 16,
    lineHeight: 18,
    color: '#242424',
    width: 100,
  },
  timeContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 2,
  },
  timeBox: {
    width: 80,
    height: 37,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: fonts.family.leagueSpartanRegular,
    fontSize: 15,
    lineHeight: 14,
    color: '#242424',
  },
  closedContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closedBox: {
    width: 162,
    height: 37,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    marginTop: 20,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 120,
  },
});

export default SupplierAvailabilityScreen;
