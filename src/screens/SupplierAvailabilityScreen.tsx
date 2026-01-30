import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {themeColors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import OperationsBottomNavBar from '../components/OperationsBottomNavBar';

// Header truck/logo SVGs
import Logo14_1 from '../assets/images/14_1.svg';

const {width: screenWidth} = Dimensions.get('window');

interface DaySchedule {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  isClosed?: boolean;
}

const SupplierAvailabilityScreen: React.FC = () => {
  const navigation = useNavigation();

  const [schedule, setSchedule] = useState<DaySchedule[]>([
    {day: 'Monday', enabled: true, startTime: '07:00 AM', endTime: '05:00 PM'},
    {day: 'Tuesday', enabled: true, startTime: '07:00 AM', endTime: '05:00 PM'},
    {
      day: 'Wednesday',
      enabled: true,
      startTime: '07:00 AM',
      endTime: '05:00 PM',
    },
    {
      day: 'Thursday',
      enabled: true,
      startTime: '07:00 AM',
      endTime: '05:00 PM',
    },
    {day: 'Friday', enabled: true, startTime: '07:00 AM', endTime: '05:00 PM'},
    {
      day: 'Saturday',
      enabled: true,
      startTime: '07:00 AM',
      endTime: '03:00 PM',
    },
    {day: 'Sunday', enabled: false, startTime: '', endTime: '', isClosed: true},
  ]);

  const toggleDay = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].enabled = !newSchedule[index].enabled;
    setSchedule(newSchedule);
  };

  const handleBack = () => {
    navigation.goBack();
  };

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
            start={{x: 0.12, y: 0.05}}
            end={{x: 0.88, y: 0.95}}
            style={styles.headerGradient}>
            {/* subtle translucent overlay */}
            <LinearGradient
              colors={['rgba(137,217,87,0.2)', 'rgba(137,217,87,0.2)']}
              start={{x: 0, y: 0}}
              end={{x: 0, y: 1}}
              style={styles.overlayGradient}
              pointerEvents="none"
            />

            {/* Title and Subtitle */}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Operations</Text>
              <Text style={styles.headerSubtitle}>Edit service coverage</Text>
            </View>

            {/* Decorative Image (truck/logo) */}
            <View style={styles.decorativeImageContainer}>
              <Logo14_1 width={148} height={63} />
            </View>
          </LinearGradient>
        </View>

        {/* Availability Management Card */}
        <View style={styles.availabilityCardContainer}>
          <LinearGradient
            colors={['#C0F96F', '#90B93E']}
            locations={[0.2009, 0.7847]}
            start={{x: 0.15, y: 0.1}}
            end={{x: 0.85, y: 0.9}}
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
            start={{x: 0.11, y: 0}}
            end={{x: 0.89, y: 1}}
            style={styles.scheduleCard}>
            {/* Set operating hours Title */}
            <Text style={styles.scheduleTitle}>Set operating hours</Text>

            {/* Schedule Rows */}
            {schedule.map((item, index) => (
              <View key={item.day} style={styles.scheduleRow}>
                {/* Checkbox */}
                <TouchableOpacity
                  style={styles.checkbox}
                  activeOpacity={0.7}
                  onPress={() => toggleDay(index)}>
                  <LinearGradient
                    colors={['#EFF2F0', '#EAFFCC']}
                    locations={[0.2377, 0.6629]}
                    start={{x: 0.11, y: 0}}
                    end={{x: 0.89, y: 1}}
                    style={styles.checkboxGradient}>
                    {item.enabled && <Text style={styles.checkmark}>✓</Text>}
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
                      start={{x: 0.11, y: 0}}
                      end={{x: 0.89, y: 1}}
                      style={styles.closedBox}>
                      <Text style={styles.timeText}>Closed</Text>
                    </LinearGradient>
                  </View>
                ) : (
                  <View style={styles.timeContainer}>
                    <LinearGradient
                      colors={['#EFF2F0', '#EAFFCC']}
                      locations={[0.2377, 0.6629]}
                      start={{x: 0.11, y: 0}}
                      end={{x: 0.89, y: 1}}
                      style={styles.timeBox}>
                      <Text style={styles.timeText}>{item.startTime}</Text>
                    </LinearGradient>
                    <LinearGradient
                      colors={['#EFF2F0', '#EAFFCC']}
                      locations={[0.2377, 0.6629]}
                      start={{x: 0.11, y: 0}}
                      end={{x: 0.89, y: 1}}
                      style={styles.timeBox}>
                      <Text style={styles.timeText}>{item.endTime}</Text>
                    </LinearGradient>
                  </View>
                )}
              </View>
            ))}
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <OperationsBottomNavBar activeTab="operations" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
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
    marginBottom: 20,
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
    fontSize: 20,
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
    width: 113,
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
    width: 228,
    height: 37,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacing: {
    height: 120,
  },
});

export default SupplierAvailabilityScreen;
