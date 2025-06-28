import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const AttachmentPreview = ({ attachments, onRemove, editable = true }) => {
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openPreview = (attachment) => {
    if (attachment.type === 'image') {
      // Fotoğraflar için modal açılır
    setSelectedAttachment(attachment);
    setModalVisible(true);
    } else {
      // Belgeler için sistem uygulamasında açılır
      openDocument(attachment);
    }
  };

  const openDocument = async (attachment) => {
    // Doğrudan Share API ile aç - en güvenilir yöntem
    shareDocument(attachment);
  };



  const shareDocument = async (attachment) => {
    try {
      // React Native Share API'sini kullanarak dosyayı aç
      const { Share } = require('react-native');
      
      const result = await Share.share({
        url: attachment.uri,
        title: `${attachment.name}`,
        message: `${attachment.name} dosyasını görüntülemek için bir uygulama seçin`
      });

      if (result.action === Share.sharedAction) {
        console.log('Document opened successfully');
      }
    } catch (error) {
      console.error('Document open error:', error);
      Alert.alert(
        'Dosya Açma Hatası', 
        'Dosya açılamadı. Dosya bozuk olabilir veya uygun uygulama bulunamadı.'
      );
    }
  };



  const getFileExtension = (fileName) => {
    return fileName.split('.').pop() || '';
  };

  const closePreview = () => {
    setModalVisible(false);
    setSelectedAttachment(null);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'document-text';
      case 'doc':
      case 'docx':
        return 'document';
      case 'xls':
      case 'xlsx':
        return 'grid';
      case 'ppt':
      case 'pptx':
        return 'easel';
      case 'txt':
        return 'document-text-outline';
      case 'zip':
      case 'rar':
        return 'archive';
      default:
        return 'document-outline';
    }
  };

  const getFileColor = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return '#FF5722';
      case 'doc':
      case 'docx':
        return '#2196F3';
      case 'xls':
      case 'xlsx':
        return '#4CAF50';
      case 'ppt':
      case 'pptx':
        return '#FF9800';
      case 'txt':
        return '#9E9E9E';
      case 'zip':
      case 'rar':
        return '#795548';
      default:
        return '#6C757D';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  const renderAttachmentItem = (attachment, index) => {
    const isImage = attachment.type === 'image';
    
    return (
      <View key={attachment.id} style={styles.attachmentCard}>
        <TouchableOpacity
          style={styles.previewContainer}
          onPress={() => openPreview(attachment)}
        >
          {isImage ? (
            <Image 
              source={{ uri: attachment.uri }} 
              style={styles.imageThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.fileIcon, { backgroundColor: getFileColor(attachment.name) + '20' }]}>
              <Ionicons 
                name={getFileIcon(attachment.name)} 
                size={24} 
                color={getFileColor(attachment.name)} 
              />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.attachmentInfo}>
          <Text style={styles.fileName} numberOfLines={2}>
            {attachment.name}
          </Text>
          {attachment.size && (
            <Text style={styles.fileSize}>
              {formatFileSize(attachment.size)}
            </Text>
          )}
        </View>

        {editable && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(attachment.id)}
          >
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPreviewModal = () => {
    if (!selectedAttachment) return null;

    const isImage = selectedAttachment.type === 'image';

    return (
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closePreview}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closePreview} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedAttachment.name}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.modalContent}>
            {isImage ? (
              <ScrollView
                style={styles.imageContainer}
                maximumZoomScale={3}
                minimumZoomScale={1}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                <Image
                  source={{ uri: selectedAttachment.uri }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </ScrollView>
            ) : (
              <View style={styles.filePreview}>
                <View style={[styles.largeFileIcon, { backgroundColor: getFileColor(selectedAttachment.name) + '20' }]}>
                  <Ionicons 
                    name={getFileIcon(selectedAttachment.name)} 
                    size={64} 
                    color={getFileColor(selectedAttachment.name)} 
                  />
                </View>
                <Text style={styles.largeFileName}>{selectedAttachment.name}</Text>
                {selectedAttachment.size && (
                  <Text style={styles.largeFileSize}>
                    {formatFileSize(selectedAttachment.size)}
                  </Text>
                )}
                <Text style={styles.fileNote}>
                  Bu dosya türü için önizleme desteklenmiyor
                </Text>
                
                {/* Dosya açma butonu */}
                <View style={styles.documentActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.openButton]}
                    onPress={() => {
                      closePreview();
                      openDocument(selectedAttachment);
                    }}
                  >
                    <Ionicons name="open-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Dosyayı Aç</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Ek Dosyalar ({attachments.length})</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.attachmentsList}
        contentContainerStyle={styles.attachmentsContent}
      >
        {attachments.map((attachment, index) => renderAttachmentItem(attachment, index))}
      </ScrollView>
      {renderPreviewModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  attachmentsList: {
    flexGrow: 0,
  },
  attachmentsContent: {
    paddingHorizontal: 4,
  },
  attachmentCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  previewContainer: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  fileIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  attachmentInfo: {
    flex: 1,
    paddingBottom: 4,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 10,
    color: '#6C757D',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    width: width,
  },
  fullImage: {
    width: width,
    height: height - 120,
  },
  filePreview: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  largeFileIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  largeFileName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  largeFileSize: {
    fontSize: 14,
    color: '#ADB5BD',
    marginBottom: 20,
  },
  fileNote: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 30,
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  openButton: {
    backgroundColor: '#007AFF',
  },
  shareButton: {
    backgroundColor: '#28A745',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AttachmentPreview; 