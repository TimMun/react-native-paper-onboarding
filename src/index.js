import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  PanResponder,
  Dimensions,
  Animated,
  View,
  TouchableWithoutFeedback
} from 'react-native';

import styles from './styles';

const { width, height } = Dimensions.get('screen');
var RESPOND_THRESHHOLD = width / 7;
if (width > 800) { // For large screens (i.e. ipad)
  RESPOND_THRESHHOLD = width / 14;
}

const viewRadiusInterpolation = {
  inputRange: [0, 1],
  outputRange: [5, height / 2],
};

const viewRadiusInterpolationR = {
  inputRange: [0, 1],
  outputRange: [height / 2, 5],
};

const fadeInInterpolation = {
  inputRange: [0, 1],
  outputRange: [0.0, 1],
};

const fadeOutInterpolation = {
  inputRange: [0, 1],
  outputRange: [1.0, 0.0],
};

const viewScaleInterpolation = {
  inputRange: [0, 1],
  outputRange: [0, (height * 2) / 5],
};

const viewScaleInterpolationR = {
  inputRange: [0, 1],
  outputRange: [(height * 2) / 5, 0],
};

const tabpanelInterpolation = {
  inputRange: [0, 1],
  outputRange: [0, -12],
};

const tabpanelInterpolationR = {
  inputRange: [0, 1],
  outputRange: [0, 12],
};

class PaperOnboardingContainer extends Component {
  static propTypes = {
    screens: PropTypes.array,
    onIndexChanged: PropTypes.func,
    advanceOnPressTabIndicator: PropTypes.bool,
    containerStyle: PropTypes.object,
    indicatorContainerStyle: PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.nextBackground = 0;
    this.state = {
      currentScreen: 0,
      animationFinish: true,
      nextPoint: { x: 0, y: 0 },
      isSwipeDirectionLeft: true,
      rootBackground: this.props.screens[0].backgroundColor,
      backgroundAnimation: new Animated.Value(0),
      panResponder: PanResponder.create({
        // onStartShouldSetPanResponder: () => true,
        // onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (e, gestureState) => {
          const { dx, dy } = gestureState
          return (dx > 2 || dx < -2 || dy > 2 || dy < -2)
        },
        onMoveShouldSetPanResponderCapture: (e, gestureState) => {
          const { dx, dy } = gestureState
          return (dx > 2 || dx < -2 || dy > 2 || dy < -2)
        },
        // onMoveShouldSetResponderCapture: () => true,
        onPanResponderRelease: (e, gestureState) => {
          const { x0, y0, dx, dy } = gestureState; // eslint-disable-line object-curly-newline

          const nextPoint = {
            x: x0 + dx,
            y: y0 + dy,
          };

          if (Math.abs(dx) >= RESPOND_THRESHHOLD) {
            if (dx > 0) {
              this.onSwipe('right', nextPoint);
            } else {
              this.onSwipe('left', nextPoint);
            }
          }
          return true;
        },
      }),
    };
  }

  onSwipe(swipeDirection, nextPoint) {
    const { currentScreen } = this.state;
    const nextIndex = this.getNextScreenIndex(swipeDirection);

    const isSwipeDirectionLeft = swipeDirection === 'left';

    this.nextBackground = isSwipeDirectionLeft
      ? this.props.screens[nextIndex].backgroundColor
      : this.props.screens[currentScreen].backgroundColor;

    this.startBackgroundAnimation(
      currentScreen,
      nextIndex,
      nextPoint,
      isSwipeDirectionLeft,
    );
  }

  getNextScreenIndex(direction) {
    const { currentScreen } = this.state;
    let directionModifier = 0;
    if (direction === 'left') {
      directionModifier = 1;
    } else if (direction === 'right') {
      directionModifier = -1;
    }

    let nextIndex = currentScreen + directionModifier;
    if (nextIndex < 0) {
      nextIndex = this.props.screens.length - 1;
    } else if (nextIndex >= this.props.screens.length) {
      nextIndex = 0;
    }
    return nextIndex;
  }

  callAnimations = (currentScreen, nextIndex) => {
    const { backgroundAnimation } = this.state;
    const { screens } = this.props;
    Animated.timing(
      backgroundAnimation,
      { toValue: 1, duration: 900 },
    ).start(() => {
      backgroundAnimation.setValue(0);
      this.nextBackground = screens[currentScreen].backgroundColor;

      this.setState({
        nextIndex: null,
        animationFinish: true,
        currentScreen: nextIndex,
        rootBackground: screens[nextIndex].backgroundColor,
        nextPoint: { x: 0, y: 0 },
      });

      if (typeof this.props.onIndexChanged === 'function') {
        this.props.onIndexChanged(this.state.currentScreen)
      };
    });
  }

  startBackgroundAnimation = (currentScreen, nextIndex, nextPoint, isSwipeDirectionLeft) => {
    this.setState(
      {
        nextIndex,
        nextPoint,
        isSwipeDirectionLeft,
        animationFinish: false,
        rootBackground: isSwipeDirectionLeft
          ? this.props.screens[currentScreen].backgroundColor
          : this.props.screens[nextIndex].backgroundColor,
      },
      () => this.callAnimations(currentScreen, nextIndex),
    );
  }

  renderRippleBackground(backgroundColor, isSwipeDirectionLeft = true) {
    const { backgroundAnimation, nextPoint, animationFinish } = this.state;
    const radius = isSwipeDirectionLeft ? viewRadiusInterpolationR : viewRadiusInterpolation;
    const scale = isSwipeDirectionLeft ? viewScaleInterpolation : viewScaleInterpolationR;
    if (!animationFinish) {
      return (
        <Animated.View
          style={[
            styles.rippleView,
            {
              top: nextPoint.y,
              left: nextPoint.x,
              backgroundColor,
              borderRadius: backgroundAnimation.interpolate(radius),
              transform: [{ scale: backgroundAnimation.interpolate(scale) }],
            },
          ]}
        />
      );
    }
    return null;
  }

  fadeInStyle = () => {
    const { backgroundAnimation } = this.state;
    return {
      opacity: backgroundAnimation.interpolate(fadeInInterpolation),
    };
  }

  fadeOutStyle = () => {
    const { backgroundAnimation } = this.state;
    return {
      opacity: backgroundAnimation.interpolate(fadeOutInterpolation),
    };
  }

  onPressTabIndicator = () => {
    if (this.props.advanceOnPressTabIndicator) {
      this.onSwipe('left', { x: width, y: height / 2 });
    }
  }

  renderTabIndicators(isSwipeDirectionLeft) {
    const { screens } = this.props;
    const { currentScreen, backgroundAnimation } = this.state;
    const translate = isSwipeDirectionLeft ? tabpanelInterpolation : tabpanelInterpolationR;
    const leftSide = [];
    const rightSide = [];
    let passActiveScreenFlag = false;
    screens.forEach((item, index) => {
      if (currentScreen === index) {
        passActiveScreenFlag = true;
      }
      if (passActiveScreenFlag && index !== currentScreen) {
        leftSide.push(
          <View
            key={index}
            style={[
              styles.indicator,
              styles.inactiveIndicator,
            ]}
          />,
        );
      } else if (index !== currentScreen) {
        rightSide.push(
          <View
            key={index}
            style={[
              styles.indicator,
              styles.inactiveIndicator,
            ]}
          />,
        );
      }
    });

    return (
      <Animated.View
        style={[
          styles.tabnabIndicatorContainer,
          { transform: [{ translateX: backgroundAnimation.interpolate(translate) }] },
        ]}
      >

        <View style={styles.tabIndicatorRight}>
          {rightSide}
        </View>
        <View style={styles.tabActiveContainer}>
          <View
            key={'active_tab'}
            style={[
              styles.indicator,
              styles.activeIndicator,
            ]}
          />
        </View>
        <View style={styles.tabIndicatorLeft}>
          {leftSide}
        </View>
      </Animated.View>
    );
  }

  getScreensArray = () => {
    const {
      nextIndex,
      currentScreen,
    } = this.state;
    return [
      <Animated.View
        key={'current_screen_container'}
        style={[styles.screenAnimatedContainer, this.fadeOutStyle()]}
      >
        {this.renderScreen(currentScreen)}
      </Animated.View>,
      nextIndex !== undefined
        ? (
          <Animated.View
            key={'next_screen_container'}
            style={[styles.nextScreenContainer, this.fadeInStyle()]}
          >
            {this.renderScreen(nextIndex)}
          </Animated.View>
        )
        : null,
    ];
  }

  renderScreen = (index) => {
    if (typeof index === 'number') {
      let screen = this.props.screens[index];
      return React.createElement(screen, { currentIndex: this.state.currentScreen });
    }
  }

  render() {
    const {
      isSwipeDirectionLeft,
      rootBackground,
    } = this.state;
    const screensArray = this.getScreensArray();

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: rootBackground },
          this.props.containerStyle
        ]}
        {...this.state.panResponder.panHandlers}
      >
        {this.renderRippleBackground(this.nextBackground, isSwipeDirectionLeft)}
        {isSwipeDirectionLeft ? screensArray : screensArray.reverse()}
        <TouchableWithoutFeedback onPress={this.onPressTabIndicator} >
          <View style={[styles.indicatorContainer, this.props.indicatorContainerStyle]}>
            {this.renderTabIndicators(isSwipeDirectionLeft)}
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}

export default PaperOnboardingContainer;
