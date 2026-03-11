import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet } from 'react-native';
import tw from 'twrnc';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TooltipProps {
  isFirstStep?: boolean;
  isLastStep?: boolean;
  currentStep: any;
  labels?: any;
  handleNext?: () => void;
  handlePrev?: () => void;
  handleStop?: () => void;
}

export default function CustomTooltip({
  isFirstStep = false,
  isLastStep = false,
  currentStep,
  labels,
  handleNext,
  handlePrev,
  handleStop,
}: TooltipProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [pulseAnim] = useState(new Animated.Value(1));

  if (!currentStep) return null;

  const onNext = handleNext ?? (() => {});
  const onPrev = handlePrev ?? (() => {});
  const onStop = handleStop ?? (() => {});

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for spotlight
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [fadeAnim, scaleAnim, pulseAnim]);

  return (
    <>
      {/* Spotlight Overlay */}
      <Animated.View 
        style={[
          styles.spotlightOverlay,
          {
            opacity: fadeAnim,
          }
        ]}
      />
      
      {/* Highlight Ring */}
      <Animated.View
        style={[
          styles.highlightRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: fadeAnim,
            left: currentStep?.target?.x ? currentStep.target.x - 40 : SCREEN_WIDTH / 2 - 40,
            top: currentStep?.target?.y ? currentStep.target.y - 40 : SCREEN_HEIGHT / 2 - 40,
          },
        ]}
      />

      {/* Main Tooltip */}
      <Animated.View
        style={[
          styles.tooltipContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            left: currentStep?.target?.x ? Math.min(currentStep.target.x, SCREEN_WIDTH - 320) : SCREEN_WIDTH / 2 - 160,
            top: currentStep?.target?.y ? currentStep.target.y - 120 : SCREEN_HEIGHT / 2 - 100,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.tooltipHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>✨</Text>
          </View>
          <Text style={styles.stepIndicator}>
            Step {currentStep?.order || 1} of {currentStep?.totalSteps || 6}
          </Text>
        </View>

        {/* Message */}
        <Text style={styles.messageText}>
          {currentStep.text}
        </Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {!isFirstStep && (
            <TouchableOpacity
              style={[styles.actionButton, styles.previousButton]}
              onPress={onPrev}
              activeOpacity={0.8}
            >
              <Text style={styles.previousText}>← {labels?.back ?? 'Previous'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.rightButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={onStop}
              activeOpacity={0.8}
            >
              <Text style={styles.skipText}>{labels?.skip ?? 'Skip'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.nextButton]}
              onPress={isLastStep ? onStop : onNext}
              activeOpacity={0.9}
            >
              <Text style={styles.nextText}>
                {isLastStep ? (labels?.finish ?? 'Finish') : (labels?.next ?? 'Next')} →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  spotlightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 9998,
  },
  highlightRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#2E523A',
    backgroundColor: 'rgba(46, 82, 58, 0.2)',
    shadowColor: '#2E523A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    zIndex: 9999,
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 82, 58, 0.15)',
    minWidth: 300,
    maxWidth: 350,
    zIndex: 10000,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(46, 82, 58, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 14,
  },
  stepIndicator: {
    fontSize: 12,
    color: '#6C8770',
    fontWeight: '500',
  },
  messageText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 40,
  },
  previousButton: {
    backgroundColor: 'rgba(108, 135, 112, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(108, 135, 112, 0.3)',
  },
  previousText: {
    fontSize: 13,
    color: '#6C8770',
    fontWeight: '500',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
    marginRight: 8,
  },
  skipText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#2E523A',
    shadowColor: '#2E523A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  nextText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
