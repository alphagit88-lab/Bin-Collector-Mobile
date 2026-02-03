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
import Svg14 from '../assets/images/3_1.svg';
import CloseIcon from '../assets/images/35 3.svg';
import BinCollectBg from '../assets/images/Bin.Collect_2.svg';
import AddIcon from '../assets/images/Bin.Collect (1) 1.svg';
import Rectangle11 from '../assets/images/Rectangle 11.svg';

const {width: screenWidth} = Dimensions.get('window');

interface ServiceZoneData {
  id: string;
  country: string;
  city: string;
  areaRadius: string;
}

const ServiceAreaScreen: React.FC = () => {
  const navigation = useNavigation();

  const [serviceZones, setServiceZones] = useState<ServiceZoneData[]>([
    {
      id: '1',
      country: 'Canada',
      city: 'Ottawa',
      areaRadius: '45KM',
    },
  ]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddNewServiceArea = () => {
    // TODO: Implement add new service area functionality
    console.log('Add new service area pressed');
  };

  const handleRemoveZone = (id: string) => {
    setServiceZones(serviceZones.filter(zone => zone.id !== id));
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

            {/* Large truck SVG placed inside header */}
            <View style={styles.headerSvgContainer} pointerEvents="none">
              <Svg14 width={screenWidth - 4} height={177} />
            </View>
          </LinearGradient>
        </View>

        {/* Service Area Section */}
        <View style={styles.sectionContainer}>
          {/* Add New Service Area Card - Outer Container */}
          <LinearGradient
            colors={['#C0F96F', '#90B93E']}
            locations={[0.2009, 0.7847]}
            start={{x: 0.15, y: 0.15}}
            end={{x: 0.85, y: 0.85}}
            style={styles.addServiceAreaOuter}>
            {/* Background image with lowered opacity */}
            <View style={styles.addCardBackground} pointerEvents="none">
              <BinCollectBg width={391} height={119} />
            </View>

            {/* Service Area Header with Back Button — inside card top */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Service Area</Text>
              <TouchableOpacity
                style={styles.backButtonContainer}
                onPress={handleBack}>
                <Text style={styles.backText}>Back</Text>
                <View style={styles.backArrowCircle}>
                  <Text style={styles.backArrow}>›</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Inner Gradient Pill Button */}
            <LinearGradient
              colors={['#9ED654', '#6EAD16']}
              locations={[0.2, 0.8]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.addServiceAreaCard}>
              <TouchableOpacity
                style={styles.addServiceAreaContent}
                activeOpacity={0.85}
                onPress={handleAddNewServiceArea}>
                <View style={styles.ellipseWhite}>
                  <AddIcon width={35} height={28} />
                </View>
                <Text style={styles.addServiceAreaText}>
                  Add New Service Area
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* Service Zone Section */}
        <View style={styles.serviceZoneContainer}>
          <LinearGradient
            colors={['#EFF2F0', '#EAFFCC']}
            locations={[0.2377, 0.6629]}
            start={{x: 0.11, y: 0}}
            end={{x: 0.89, y: 1}}
            style={styles.serviceZoneCard}>
            <Text style={styles.serviceZoneTitle}>Service Zone</Text>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Country</Text>
              <Text style={styles.tableHeaderText}>City</Text>
              <Text style={styles.tableHeaderText}>Area Radius</Text>
            </View>

            {/* Service Zone Rows */}
            {serviceZones.map(zone => (
              <View key={zone.id}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableRowTextBold}>{zone.country}</Text>
                  <Text style={styles.tableRowTextBold}>{zone.city}</Text>
                  <Text style={styles.tableRowTextBold}>{zone.areaRadius}</Text>
                </View>

                {/* Remove Button */}
                <TouchableOpacity
                  style={styles.removeButton}
                  activeOpacity={0.8}
                  onPress={() => handleRemoveZone(zone.id)}>
                  <View style={styles.removeButtonInner}>
                    <CloseIcon width={20} height={20} />
                    <Text style={styles.removeText}>Remove</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}

            {/* Map Image */}
            <View style={styles.mapContainer}>
              <Rectangle11 width={357} height={222} />
            </View>
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
    paddingTop: 241,
  },
  headerContainer: {
    position: 'absolute',
    width: 430,
    height: 241,
    left: 0,
    top: 0,
  },
  headerGradient: {
    height: 241,
    paddingTop: 20,
    paddingHorizontal: 19,
    position: 'relative',
  },
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
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
    right: 60,
    top: 9,
    width: 148,
    height: 63,
    zIndex: 3,
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
  sectionContainer: {
    paddingHorizontal: 19,
    marginBottom: 12,
  },
  // Moved inside the card — now sits at the top of the green gradient
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 2,
  },
  sectionTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 24,
    color: '#373934',
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
  },
  backText: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 8,
  },
  backArrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 16,
    color: '#504A4A',
    fontWeight: '600',
  },
  addServiceAreaOuter: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 28,
    paddingBottom: 14,
    paddingHorizontal: 14,
  },
  addCardBackground: {
    position: 'absolute',
    top: 11,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.34,
  },
  addServiceAreaCard: {
    borderRadius: 30,
    height: 56,
    overflow: 'hidden',
  },
  addServiceAreaContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ellipseWhite: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  addServiceAreaText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  serviceZoneContainer: {
    paddingHorizontal: 19,
  },
  serviceZoneCard: {
    borderRadius: 9,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  serviceZoneTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 18,
    color: '#242424',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  tableRowTextBold: {
    fontFamily: fonts.family.semiBold,
    fontSize: 14,
    color: '#242424',
    flex: 1,
  },
  removeButton: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  removeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  removeIcon: {
    display: 'none',
  },
  removeText: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#FFFFFF',
  },
  removeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#000000',
  },
  mapContainer: {
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  bottomSpacing: {
    height: 120,
  },
});

export default ServiceAreaScreen;
