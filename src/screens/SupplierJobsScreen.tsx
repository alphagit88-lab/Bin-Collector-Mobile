import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {themeColors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';

// Import SVG icons
import BannerImage from '../assets/images/4 1.svg';
import TruckIcon from '../assets/images/14_1.svg';
import ViewArrow from '../assets/images/Ellipse 11.svg';

type JobCategory =
  | 'pending'
  | 'confirmed'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'all';

interface Job {
  id: string;
  binType: string;
  binSize: string;
  status: JobCategory;
}

const mockJobs: Job[] = [
  {
    id: '1',
    binType: 'General Waste',
    binSize: '6m³ - Medium',
    status: 'pending',
  },
  {
    id: '2',
    binType: 'Concrete/Dirt',
    binSize: '6m³ - Medium',
    status: 'pending',
  },
  {
    id: '3',
    binType: 'General Waste',
    binSize: '4m³ - Small',
    status: 'confirmed',
  },
  {
    id: '4',
    binType: 'Green Waste',
    binSize: '8m³ - Large',
    status: 'confirmed',
  },
  {
    id: '5',
    binType: 'Mixed Waste',
    binSize: '6m³ - Medium',
    status: 'inProgress',
  },
  {
    id: '6',
    binType: 'Construction',
    binSize: '10m³ - XLarge',
    status: 'inProgress',
  },
  {
    id: '7',
    binType: 'General Waste',
    binSize: '4m³ - Small',
    status: 'completed',
  },
  {
    id: '8',
    binType: 'Concrete/Dirt',
    binSize: '6m³ - Medium',
    status: 'completed',
  },
  {
    id: '9',
    binType: 'General Waste',
    binSize: '6m³ - Medium',
    status: 'cancelled',
  },
];

const categoryLabels: Record<JobCategory, string> = {
  pending: 'Pending Requests',
  confirmed: 'Confirmed Bookings',
  inProgress: 'In-Progress Jobs',
  completed: 'Completed Jobs',
  cancelled: 'Cancelled Jobs',
  all: 'All Jobs',
};

const SupplierJobsScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] =
    useState<JobCategory>('pending');

  const filteredJobs =
    selectedCategory === 'all'
      ? mockJobs
      : mockJobs.filter(job => job.status === selectedCategory);

  const getCategoryCount = (category: JobCategory) => {
    if (category === 'all') return mockJobs.length;
    return mockJobs.filter(job => job.status === category).length;
  };

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

  // always render grid below

  const categoryColor = (category: JobCategory) => {
    switch (category) {
      case 'pending':
        return '#FF8A00';
      case 'confirmed':
        return '#0B63FF';
      case 'inProgress':
      case 'completed':
      case 'cancelled':
        return '#2F9E00';
      default:
        return '#2F9E00';
    }
  };

  const renderGridCard = (category: JobCategory) => {
    const label = categoryLabels[category];
    // Use design counts to match the provided screenshot (second image)
    const designCounts: Record<JobCategory, number> = {
      pending: 3,
      confirmed: 8,
      inProgress: 2,
      completed: 24,
      cancelled: 1,
      all: 9,
    };
    const count = String(
      designCounts[category] ?? getCategoryCount(category),
    ).padStart(2, '0');
    const color = categoryColor(category);
    const isSelected = selectedCategory === category;

    return (
      <TouchableOpacity
        key={category + Math.random()}
        activeOpacity={0.8}
        onPress={() => setSelectedCategory(category)}
        style={[styles.gridCard, isSelected && styles.gridCardSelected]}>
        {isSelected && (
          <LinearGradient
            colors={['#D0FF33', '#C7FFD3']}
            locations={[0.1564, 0.762]}
            start={{x: 0.2, y: 0}}
            end={{x: 0.8, y: 1}}
            style={styles.gridCardSelectedBackground}
          />
        )}
        <View style={styles.gridCardContent}>
          <Text style={[styles.gridCount, {color}]}>{count}</Text>
          <Text style={[styles.gridLabel, isSelected && {color: '#242424'}]}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Remove expanded layout: always show 2x3 grid (matches second image)

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Section with Gradient */}
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

        {/* Job Management Categories Section (updated layout) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Job Management</Text>

          <View style={styles.categoriesWrapperGrid}>
            {/* Render a 2x3 grid to match the second image layout */}
            <View style={styles.gridRow}>
              {renderGridCard('pending')}
              {renderGridCard('confirmed')}
            </View>
            <View style={styles.gridRow}>
              {renderGridCard('inProgress')}
              {renderGridCard('completed')}
            </View>
            <View style={styles.gridRow}>
              {renderGridCard('inProgress')}
              {renderGridCard('completed')}
            </View>
          </View>
        </View>

        {/* Jobs List Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.jobsListCard}>
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.jobsListGradient}>
              <View style={styles.jobsListContainer}>
                <Text style={styles.sectionTitle}>
                  {categoryLabels[selectedCategory]}
                </Text>
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job, index) => renderJobItem(job, index))
                ) : (
                  <Text style={styles.emptyText}>No jobs in this category</Text>
                )}
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <SupplierBottomNavBar activeTab="jobs" />
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
  categoriesGrid: {
    width: '100%',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryButton: {
    width: '48%',
    height: 61,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryButtonLeft: {
    marginRight: 4,
  },
  categoryButtonRight: {
    marginLeft: 4,
  },
  categoryButtonSelected: {
    backgroundColor: 'rgba(137, 217, 87, 0.2)',
    borderColor: '#6DBC00',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCount: {
    fontFamily: fonts.family.bold,
    fontSize: 24,
    color: '#242424',
    marginRight: 8,
  },
  categoryCountSelected: {
    color: '#6DBC00',
  },
  categoryLabel: {
    fontFamily: fonts.family.regular,
    fontSize: 13,
    lineHeight: 16,
    color: '#242424',
    flex: 1,
  },
  categoryLabelSelected: {
    color: '#6DBC00',
    fontFamily: fonts.family.medium,
  },
  /* Grid layout (2 columns x 3 rows) */
  categoriesWrapperGrid: {
    backgroundColor: '#E9FFD8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridCard: {
    width: '48%',
    height: 61,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  gridCardSelected: {
    borderColor: 'transparent',
  },
  gridCardSelectedBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  gridCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridCount: {
    fontFamily: fonts.family.extraBold,
    fontSize: 36,
    marginRight: 10,
  },
  gridLabel: {
    fontFamily: fonts.family.regular,
    fontSize: 13,
    color: '#242424',
    flexShrink: 1,
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
  emptyText: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    color: themeColors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SupplierJobsScreen;
