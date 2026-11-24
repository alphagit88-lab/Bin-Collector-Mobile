import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../theme/fonts';
import { getFullImageUrl } from '../utils/imageUrl';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageViewerModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  images,
  initialIndex = 0,
  title,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const flatListRef = useRef<FlatList>(null);

  // Normalize image URLs
  const normalizedImages = (images || [])
    .map(img => getFullImageUrl(img))
    .filter(Boolean);

  useEffect(() => {
    if (visible) {
      const validIndex = Math.max(0, Math.min(initialIndex, normalizedImages.length - 1));
      setCurrentIndex(validIndex);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: validIndex, animated: false });
      }, 50);
    }
  }, [visible, initialIndex, normalizedImages.length]);

  if (!visible || normalizedImages.length === 0) {
    return null;
  }

  const currentImageUrl = normalizedImages[currentIndex] || normalizedImages[0];

  const handleOpenInBrowser = async () => {
    if (!currentImageUrl) return;
    try {
      const supported = await Linking.canOpenURL(currentImageUrl);
      if (supported) {
        await Linking.openURL(currentImageUrl);
      } else {
        await Linking.openURL(currentImageUrl);
      }
    } catch (err) {
      console.error('Error opening image URL:', err);
      Alert.alert('Unable to open', 'Could not open this attachment in an external browser.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.95)" />
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText} numberOfLines={1}>
                {title || (normalizedImages.length > 1
                  ? `Attachment ${currentIndex + 1} of ${normalizedImages.length}`
                  : 'Attachment Preview')}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleOpenInBrowser}
                activeOpacity={0.7}
                accessibilityLabel="Open in Browser"
              >
                <Ionicons name="open-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.closeButton]}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Image Viewer */}
          <FlatList
            ref={flatListRef}
            data={normalizedImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => `img_${index}`}
            initialScrollIndex={Math.max(0, Math.min(initialIndex, normalizedImages.length - 1))}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={(event) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / SCREEN_WIDTH);
              if (index >= 0 && index < normalizedImages.length) {
                setCurrentIndex(index);
              }
            }}
            renderItem={({ item, index }) => (
              <View style={styles.imageSlide}>
                {loadingMap[index] && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                  </View>
                )}
                <Image
                  source={{ uri: item }}
                  style={styles.fullImage}
                  resizeMode="contain"
                  onLoadStart={() => {
                    setLoadingMap(prev => ({ ...prev, [index]: true }));
                  }}
                  onLoadEnd={() => {
                    setLoadingMap(prev => ({ ...prev, [index]: false }));
                  }}
                />
              </View>
            )}
          />

          {/* Bottom Thumbnails / Indicator if multiple images */}
          {normalizedImages.length > 1 && (
            <View style={styles.footer}>
              <FlatList
                data={normalizedImages}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailList}
                keyExtractor={(_, idx) => `thumb_${idx}`}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setCurrentIndex(index);
                      flatListRef.current?.scrollToIndex({ index, animated: true });
                    }}
                    style={[
                      styles.thumbnailWrapper,
                      currentIndex === index && styles.thumbnailWrapperActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item }} style={styles.thumbnailImage} resizeMode="cover" />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts?.family?.semiBold || 'System',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH * 0.95,
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailList: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  thumbnailWrapper: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    opacity: 0.6,
  },
  thumbnailWrapperActive: {
    borderColor: '#10B981',
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});

export default ImageViewerModal;
