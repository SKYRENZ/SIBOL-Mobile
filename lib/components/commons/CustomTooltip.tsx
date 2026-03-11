import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet } from 'react-native';
import tw from 'twrnc';
import { ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  ...rest
}: TooltipProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [pulseAnim] = useState(new Animated.Value(1));

  if (!currentStep) return null;

  // Provide default no-op functions if handlers are not passed
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

    // Pulse animation for emphasis
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [fadeAnim, scaleAnim, pulseAnim]);

  const getTooltipPosition = () => {
    // Smart positioning based on available screen space
    const defaultPosition = {
      top: currentStep?.target?.y ? currentStep.target.y - 80 : '50%',
      left: currentStep?.target?.x ? Math.min(currentStep.target.x, SCREEN_WIDTH - 280) : '50%',
      right: 'auto',
      bottom: 'auto',
    };

    // Adjust if tooltip would go off screen
    if (currentStep?.target?.x && currentStep.target.x > SCREEN_WIDTH - 280) {
      return {
        ...defaultPosition,
        left: 'auto',
        right: 20,
      };
    }

    return defaultPosition;
  };

  const position = getTooltipPosition();

  return (
    <Animated.View
      style={[
        styles.tooltipContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          ...position,
        },
      ]}
    >
      {/* Highlighting overlay */}
      <Animated.View
        style={[
          styles.highlightRing,
          {
            transform: [{ scale: pulseAnim }],
            top: currentStep?.target?.y ? -currentStep.target.y - 20 : -100,
            left: currentStep?.target?.x ? -currentStep.target.x - 20 : -100,
          },
        ]}
      />
      
      {/* Main tooltip content */}
      <View style={styles.tooltipContent}>
        {/* Header with icon */}
        <View style={styles.tooltipHeader}>
          <View style={styles.iconContainer}>
            <Sparkles size={16} color="#2E523A" />
          </View>
          <Text style={styles.stepIndicator}>
            Step {currentStep?.order || 1} of {currentStep?.totalSteps || 6}
          </Text>
        </View>

        {/* Main message */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            {currentStep.text}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          {!isFirstStep && (
            <TouchableOpacity
              style={[styles.actionButton, styles.previousButton]}
              onPress={onPrev}
              activeOpacity={0.8}
            >
              <ArrowLeft size={14} color="#6C8770" />
              <Text style={styles.previousText}>
                {labels?.back ?? 'Previous'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.rightButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={onStop}
              activeOpacity={0.8}
            >
              <X size={14} color="#9CA3AF" />
              <Text style={styles.skipText}>
                {labels?.skip ?? 'Skip'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.nextButton]}
              onPress={isLastStep ? onStop : onNext}
              activeOpacity={0.9}
            >
              <Text style={styles.nextText}>
                {isLastStep ? (labels?.finish ?? 'Finish') : (labels?.next ?? 'Next')}
              </Text>
              {!isLastStep && <ArrowRight size={14} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Pointer arrow */}
      <View style={[
        styles.arrow,
        currentStep?.target?.x > SCREEN_WIDTH - 280 ? styles.arrowRight : styles.arrowLeft
      ]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tooltipContainer: {
    position: 'absolute',
    zIndex: 9999,
    minWidth: 280,
    maxWidth: 320,
  },
  highlightRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#2E523A',
    backgroundColor: 'rgba(46, 82, 58, 0.1)',
    shadowColor: '#2E523A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  tooltipContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(46, 82, 58, 0.1)',
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
  stepIndicator: {
    fontSize: 12,
    color: '#6C8770',
    fontWeight: '500',
  },
  messageContainer: {
    marginBottom: 16,
    paddingRight: 8,
  },
  messageText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    fontWeight: '500',
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
    backgroundColor: 'rgba(108, 135, 112, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(108, 135, 112, 0.2)',
  },
  previousText: {
    fontSize: 13,
    color: '#6C8770',
    fontWeight: '500',
    marginLeft: 6,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    marginRight: 8,
  },
  skipText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 6,
  },
  nextButton: {
    backgroundColor: '#2E523A',
    shadowColor: '#2E523A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  nextText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 6,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  arrowLeft: {
    bottom: -11,
    left: 30,
  },
  arrowRight: {
    bottom: -11,
    right: 30,
  },
});