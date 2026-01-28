import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {themeColors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';

// Shared visual style with SupplierJobsScreen
import BannerImage from '../assets/images/4 1.svg';
import TruckIcon from '../assets/images/14_1.svg';
import ViewArrow from '../assets/images/Ellipse 11.svg';

interface Job {
  id: string;
  binType: string;
  binSize: string;
}

const pendingJobs: Job[] = [
  {
    id: '1',
    binType: 'General Waste',
    binSize: '6m³ - Medium',
  },
  {
    id: '2',
    binType: 'Concrete/Dirt',
    binSize: '6m³ - Medium',
  },
];

const SupplierRequestsScreen: React.FC = () => {
  const renderJobItem = (job: Job, index: number) => (
    <View key={job.id} style={styles.jobRow}>
      <View style={styles.jobColumn}>
        {index === 0 && <Text style={styles.columnHeader}>Bin Type</Text>}
        <Text style={styles.jobText}>{job.binType}</Text>
      </View>
      <View style={styles.jobColumn}>
        {index === 0 && (
          <Text style={styles.columnHeader}>Bin Size/Capacity</Text>
        )}
        <Text style={styles.jobText}>{job.binSize}</Text>
      </View>
      <View style={styles.actionColumn}>
        {index === 0 && <Text style={styles.columnHeaderAction}>Action</Text>}
        <TouchableOpacity style={styles.viewButton} activeOpacity={0.7}>
          <LinearGradient
            colors={['#1F1F1F', '#2B2B2B']}
            locations={[0, 1]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.viewButtonGradient}>
            <Text style={styles.viewButtonText}>View</Text>
            <View style={styles.viewArrow}>
              <ViewArrow width={14} height={14} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Section - same as Jobs screen */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#37B112', '#77C40A']}
            locations={[0.2227, 0.5982]}
            start={{x: 0.1, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Job Management</Text>
                <Text style={styles.headerSubtitle}>
                  Track. Manage. Collect.
                </Text>
              </View>
              <View style={styles.truckIconContainer}>
                <TruckIcon width={148} height={63} />
              </View>
            </View>
            <View style={styles.bannerContainer}>
              <BannerImage width={428} height={177} />
            </View>
          </LinearGradient>
        </View>

        {/* Pending Requests Card (same UI as design) */}
        <View style={styles.sectionContainer}>
          <View style={styles.jobsListCard}>
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.jobsListGradient}>
              <View style={styles.jobsListContainer}>
                <Text style={styles.sectionTitle}>Pending Requests</Text>
                {pendingJobs.map((job, index) => renderJobItem(job, index))}
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <SupplierBottomNavBar activeTab="requests" />
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
    width: '100%',
    marginBottom: 16,
  },
  headerGradient: {
    width: '100%',
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 19,
    paddingTop: 40,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 26,
    lineHeight: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    lineHeight: 17,
    color: '#FFFFFF',
  },
  truckIconContainer: {
    marginTop: -10,
  },
  bannerContainer: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 9,
  },
  sectionContainer: {
    paddingHorizontal: 19,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#242424',
    marginBottom: 12,
  },
  jobsListCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  jobsListGradient: {
    flex: 1,
  },
  jobsListContainer: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobColumn: {
    flex: 1,
  },
  actionColumn: {
    width: 80,
    alignItems: 'center',
  },
  columnHeader: {
    fontFamily: fonts.family.semiBold,
    fontSize: 14,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 8,
  },
  columnHeaderAction: {
    fontFamily: fonts.family.semiBold,
    fontSize: 14,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 8,
    textAlign: 'center',
  },
  jobText: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 4,
  },
  viewButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  viewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#FFFFFF',
    marginRight: 4,
  },
  viewArrow: {
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SupplierRequestsScreen;
