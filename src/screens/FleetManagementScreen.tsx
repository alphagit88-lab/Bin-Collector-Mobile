import React from 'react';
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
import Svg14 from '../assets/images/14.svg';
// replaced AddBinIcon SVG import due to bundler resolution issues
import EditIcon from '../assets/images/35 2.svg';
import DeleteIcon from '../assets/images/35 3.svg';

const {width: screenWidth} = Dimensions.get('window');

interface BinItem {
  id: string;
  binId: string;
  binType: string;
  binSize: string;
  quantity: number;
}

const FleetManagementScreen: React.FC = () => {
  const navigation = useNavigation();

  const bins: BinItem[] = [
    {
      id: '1',
      binId: '#10021',
      binType: 'General Waste',
      binSize: '6m³',
      quantity: 5,
    },
    {
      id: '2',
      binId: '#10021',
      binType: 'General Waste',
      binSize: '6m³',
      quantity: 5,
    },
    {
      id: '3',
      binId: '#10021',
      binType: 'General Waste',
      binSize: '6m³',
      quantity: 5,
    },
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddNewBin = () => {
    // TODO: Navigate to Add New Bin screen
    console.log('Add New Bin pressed');
  };

  const handleEditBin = (binId: string) => {
    // TODO: Navigate to Edit Bin screen
    console.log('Edit Bin pressed:', binId);
  };

  const handleRemoveBin = (binId: string) => {
    // TODO: Implement remove bin functionality
    console.log('Remove Bin pressed:', binId);
  };

  const renderBinCard = (bin: BinItem, index: number) => (
    <LinearGradient
      key={bin.id}
      colors={['#EFF2F0', '#EAFFCC']}
      locations={[0.2377, 0.6629]}
      start={{x: 0.11, y: 0}}
      end={{x: 0.89, y: 1}}
      style={styles.binCard}>
      {/* Bin Details Row */}
      <View style={styles.binDetailsRow}>
        <View style={styles.binDetailColumn}>
          <Text style={styles.binDetailLabel}>Bin ID</Text>
          <Text style={styles.binDetailValue}>{bin.binId}</Text>
        </View>
        <View style={styles.binDetailColumn}>
          <Text style={styles.binDetailLabel}>Bin Type</Text>
          <Text style={styles.binDetailValue}>{bin.binType}</Text>
        </View>
        <View style={styles.binDetailColumn}>
          <Text style={styles.binDetailLabel}>Bin Size</Text>
          <Text style={styles.binDetailValue}>{bin.binSize}</Text>
        </View>
        <View style={styles.binDetailColumn}>
          <Text style={styles.binDetailLabel}>Quantity:</Text>
          <Text style={styles.binDetailValue}>{bin.quantity} Available</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditBin(bin.id)}
          activeOpacity={0.8}>
          <View style={styles.buttonIconContainer}>
            <EditIcon width={21} height={17} />
          </View>
          <Text style={styles.editButtonText}>Edit Bin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveBin(bin.id)}
          activeOpacity={0.8}>
          <View style={styles.buttonIconContainer}>
            <DeleteIcon width={21} height={17} />
          </View>
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

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
            {/* Overlay */}
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

            {/* Large truck SVG */}
            <View style={styles.headerSvgContainer} pointerEvents="none">
              <Svg14 width={screenWidth - 4} height={177} />
            </View>
          </LinearGradient>
        </View>

        {/* Fleet Management Card */}
        <View style={styles.fleetManagementContainer}>
          <LinearGradient
            colors={['#C0F96F', '#90B93E']}
            locations={[0.2009, 0.7847]}
            start={{x: 0.146, y: 0}}
            end={{x: 0.854, y: 1}}
            style={styles.fleetManagementCard}>
            {/* Background pattern overlay */}
            <View style={styles.patternOverlay} />

            {/* Title Row */}
            <View style={styles.fleetTitleRow}>
              <Text style={styles.fleetManagementTitle}>Fleet Management</Text>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.8}>
                <Text style={styles.backButtonText}>Back</Text>
                <View style={styles.backArrowCircle}>
                  <Text style={styles.backArrow}>›</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Add New Bin Button */}
            <TouchableOpacity
              style={styles.addNewBinButton}
              onPress={handleAddNewBin}
              activeOpacity={0.85}>
              <LinearGradient
                colors={['rgba(137, 217, 87, 0.2)', 'rgba(137, 217, 87, 0.2)']}
                start={{x: 0, y: 0}}
                end={{x: 0, y: 1}}
                style={styles.addNewBinOverlay}
              />
              <LinearGradient
                colors={['#9CCD17', '#009B5F']}
                locations={[0, 1]}
                start={{x: 0, y: 0.5}}
                end={{x: 1, y: 0.5}}
                style={styles.addNewBinGradient}>
                <View style={styles.addBinIconCircle}>
                  <Text style={styles.addBinPlus}>+</Text>
                </View>
                <Text style={styles.addNewBinText}>Add New Bin</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Bins List Container */}
        <View style={styles.binsListContainer}>
          <LinearGradient
            colors={['#EFF2F0', '#EAFFCC']}
            locations={[0.2377, 0.6629]}
            start={{x: 0.11, y: 0}}
            end={{x: 0.89, y: 1}}
            style={styles.binsListCard}>
            {/* Fleet Management Header */}
            <Text style={styles.binsListTitle}>Fleet Management</Text>

            {/* Bins List */}
            {bins.map((bin, index) => renderBinCard(bin, index))}

            {/* View All Link */}
            <View style={styles.viewAllContainer}>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Job Management Tab */}
        <View style={styles.jobManagementContainer}>
          <View style={styles.jobManagementTab}>
            <View style={styles.jobIconPlaceholder} />
            <Text style={styles.jobManagementText}>Job Management</Text>
          </View>
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
    width: screenWidth - 4,
    height: 177,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 2,
  },

  // Fleet Management Card Section
  fleetManagementContainer: {
    paddingHorizontal: 19,
    marginBottom: 16,
  },
  fleetManagementCard: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.34,
  },
  fleetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fleetManagementTitle: {
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
    fontSize: 14,
    color: '#252525',
    fontWeight: 'bold',
    marginLeft: 1,
  },
  addNewBinButton: {
    borderRadius: 38,
    overflow: 'hidden',
  },
  addNewBinOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  addNewBinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  addBinIconCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addBinPlus: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    color: '#009B5F',
    lineHeight: 20,
  },
  addNewBinText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Bins List Section
  binsListContainer: {
    paddingHorizontal: 19,
    marginBottom: 16,
  },
  binsListCard: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 10,
  },
  binsListTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 18,
    color: '#242424',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  binCard: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 14,
    marginBottom: 12,
  },
  binDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  binDetailColumn: {
    flex: 1,
  },
  binDetailLabel: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 4,
  },
  binDetailValue: {
    fontFamily: fonts.family.bold,
    fontSize: 14,
    lineHeight: 15,
    color: '#242424',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#89D957',
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  buttonIconContainer: {
    marginRight: 6,
  },
  editButtonText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    lineHeight: 15,
    color: '#FFFFFF',
  },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252525',
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  removeButtonText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    lineHeight: 15,
    color: '#FFFFFF',
  },
  viewAllContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginRight: 4,
  },
  viewAllText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    lineHeight: 19,
    color: '#FFFFFF',
  },

  // Job Management Tab
  jobManagementContainer: {
    paddingHorizontal: 19,
    marginBottom: 16,
  },
  jobManagementTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFFC7',
    borderRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  jobIconPlaceholder: {
    width: 35,
    height: 28,
    marginRight: 8,
  },
  jobManagementText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 18,
    color: '#4E4B4B',
  },

  bottomSpacing: {
    height: 120,
  },
});

export default FleetManagementScreen;
