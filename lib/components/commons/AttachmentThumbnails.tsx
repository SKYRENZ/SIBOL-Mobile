import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { X, FileText } from 'lucide-react-native';

export type AttachmentThumbItem = {
  uri: string;
  name?: string;
  type?: string | null;
};

interface AttachmentThumbnailsProps {
  items: AttachmentThumbItem[];
  onRemove?: (index: number) => void;
  onPressItem?: (item: AttachmentThumbItem, index: number) => void;

  size?: number; // square size
  radius?: number;
  style?: ViewStyle;

  showCount?: boolean;
  countLabel?: string; // default "Selected"
}

const isLikelyImage = (nameOrUri?: string, type?: string | null) => {
  const t = String(type || '').toLowerCase();
  if (t.startsWith('image/')) return true;

  const s = String(nameOrUri || '').toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(s);
};

const getExt = (nameOrUri?: string) => {
  const s = String(nameOrUri || '').split('?')[0];
  const last = s.substring(s.lastIndexOf('/') + 1);
  const dot = last.lastIndexOf('.');
  if (dot === -1) return 'FILE';
  const ext = last.substring(dot + 1).trim().toUpperCase();
  return ext || 'FILE';
};

const AttachmentThumbnails: React.FC<AttachmentThumbnailsProps> = ({
  items,
  onRemove,
  onPressItem,
  size = 56,
  radius = 10,
  style,
  showCount = true,
  countLabel = 'Selected',
}) => {
  const countText = useMemo(() => {
    if (!showCount || !items?.length) return null;
    return `${countLabel}: ${items.length}`;
  }, [showCount, items?.length, countLabel]);

  if (!items || items.length === 0) return null;

  return (
    <View style={style}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item, index) => {
          const image = isLikelyImage(item.name || item.uri, item.type);

          const TileWrapper = onPressItem ? TouchableOpacity : View;
          const tileProps = onPressItem
            ? { activeOpacity: 0.85, onPress: () => onPressItem(item, index) }
            : {};

          return (
            <TileWrapper
              key={`${item.uri}_${index}`}
              {...(tileProps as any)}
              style={[
                styles.tile,
                {
                  width: size,
                  height: size,
                  borderRadius: radius,
                },
              ]}
            >
              {image ? (
                <Image source={{ uri: item.uri }} resizeMode="cover" style={styles.img} />
              ) : (
                <View style={styles.fileTile}>
                  <FileText color="#6B7280" size={18} strokeWidth={2} />
                  <Text style={styles.fileExt} numberOfLines={1}>
                    {getExt(item.name || item.uri)}
                  </Text>
                </View>
              )}

              {!!onRemove && (
                <TouchableOpacity
                  onPress={() => onRemove(index)}
                  activeOpacity={0.85}
                  style={styles.removeBtn}
                  accessibilityLabel="Remove attachment"
                >
                  <X color="#fff" size={14} strokeWidth={2.2} />
                </TouchableOpacity>
              )}
            </TileWrapper>
          );
        })}
      </ScrollView>

      {!!countText && <Text style={styles.countText}>{countText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingRight: 6,
  },
  tile: {
    marginRight: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  fileTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 3,
  },
  fileExt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    marginTop: 6,
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});

export default AttachmentThumbnails;